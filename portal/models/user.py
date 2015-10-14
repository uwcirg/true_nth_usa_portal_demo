"""User model """
from datetime import datetime
from dateutil import parser
from flask import abort, request, session
from flask.ext.user import UserMixin
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.postgresql import ENUM

from ..extensions import db
from .fhir import as_fhir, Observation, UserObservation
from .fhir import CodeableConcept, ValueQuantity

# http://hl7.org/fhir/v3/AdministrativeGender/
gender_types = ENUM('male', 'female', 'undifferentiated', name='genders',
                    create_type=False)


class User(db.Model, UserMixin):
    __tablename__ = 'users'  # Override default 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), unique=True)
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    registered = db.Column(db.DateTime, default=datetime.now)
    email = db.Column(db.String(120), unique=True)
    phone = db.Column(db.String(40), unique=True)
    gender = db.Column('gender', gender_types)
    birthdate = db.Column(db.Date)
    image_url = db.Column(db.Text)
    active = db.Column('is_active', db.Boolean(), nullable=False,
            server_default='1')

    # Only used for local accounts
    password = db.Column(db.String(255))
    reset_password_token = db.Column(db.String(100))
    confirmed_at = db.Column(db.DateTime())

    observations = db.relationship('Observation',
            secondary="user_observations", backref=db.backref('users'))
    roles = db.relationship('Role', secondary='user_roles',
            backref=db.backref('users', lazy='dynamic'))

    def add_observation(self, fhir):
        if not 'coding' in fhir['name']:
            return 400, "requires at least one CodeableConcept"
        if not 'valueQuantity' in fhir:
            return 400, "missing required 'valueQuantity'"

        # Only retaining first Codeable Concept at this time
        first_cc = fhir['name']['coding'][0]
        cc = CodeableConcept(system=first_cc.get('system'),
                code=first_cc.get('code'),
                display=first_cc.get('display')).add_if_not_found()

        v = fhir['valueQuantity']
        vq = ValueQuantity(value=v.get('value'),
                units=v.get('units'),
                system=v.get('system'),
                code=v.get('code')).add_if_not_found()

        issued = fhir.get('issued') and\
                parser.parse(fhir.get('issued')) or None
        observation = Observation(status=fhir.get('status'),
                issued=issued,
                codeable_concept_id=cc.id,
                value_quantity_id=vq.id).add_if_not_found()

        UserObservation(user_id=self.id,
                observation_id=observation.id).add_if_not_found()
        db.session.commit()
        return 200, "ok"

    def clinical_history(self, requestURL=None):
        now = datetime.now()
        fhir = {"resourceType": "Bundle",
                "title": "Clinical History",
                "link": [{"rel": "self", "href": requestURL},],
                "updated": as_fhir(now),
                "entry": []}

        for ob in self.observations:
            fhir['entry'].append({"title": "Patient Observation",
                    "updated": as_fhir(now),
                    "author": [{"name": "Truenth Portal"},],
                    "content": ob.as_fhir()})
        return fhir

    def as_fhir(self):
        d = {}
        d['resourceType'] = "Patient"
        d['identifier'] = []
        d['identifier'].append({'label': 'Truenth identifier',
                    'value': self.id})
        d['identifier'].append({'label': 'Truenth username',
                    'value': self.username})
        d['name'] = {}
        if self.first_name:
            d['name']['given'] = self.first_name
        if self.last_name:
            d['name']['family'] = self.last_name
        if self.birthdate:
            d['birthDate'] = as_fhir(self.birthdate)
        if self.gender:
            d['gender'] = {'coding': [{'system':
                "http://hl7.org/fhir/v3/AdministrativeGender",
                'code': self.gender[0].upper(),
                'display': self.gender.capitalize()}]}
        d['status'] = 'registered' if self.registered else 'unknown'
        d['communication'] = 'en-US'
        d['telecom'] = []
        if self.email:
            d['telecom'].append({'system': 'email', 'value': self.email})
        if self.phone:
            d['telecom'].append({'system': 'phone', 'value': self.phone})
        return d

    def update_from_fhir(self, fhir):
        if 'name' in fhir:
            self.first_name = fhir['name']['given'] or self.first_name
            self.last_name = fhir['name']['family'] or self.last_name
        if 'birthDate' in fhir:
            self.birthdate = datetime.strptime(fhir['birthDate'],
                    '%Y-%m-%d')
        if 'gender' in fhir:
            self.gender = fhir['gender']['coding'][0]['display'].lower()
        if 'telecom' in fhir:
            for e in fhir['telecom']:
                if e['system'] == 'email':
                    self.email = e['value']
                if e['system'] == 'phone':
                    self.phone = e['value']
        db.session.add(self)
        db.session.commit()

    def check_role(self, permission, other_id):
        """check user for adequate role"""
        if self.id == other_id:
            return True
        if 'admin' in [r.name for r in self.roles]:
            return True
        # TODO: address permission details, etc.
        abort(401, "Inadequate role for %s of %d" % (permission, other_id))


def add_authomatic_user(authomatic_user, image_url):
    """Given the result from an external IdP, create a new user"""
    user = User(username=authomatic_user.name,
            first_name=authomatic_user.first_name,
            last_name=authomatic_user.last_name,
            birthdate=authomatic_user.birth_date,
            gender=authomatic_user.gender,
            email=authomatic_user.email,
            image_url=image_url)
    db.session.add(user)
    db.session.commit()

    # All new users are given the patient role by default
    patient = Role.query.filter_by(name='patient').first()
    default_role = UserRoles(user_id=user.id,
            role_id=patient.id)
    db.session.add(default_role)
    db.session.commit()
    return user


def current_user():
    """Obtain the "current" user object

    Works for both remote oauth sessions and locally logged in sessions.

    returns current user object, or None if not logged in (local or remote)
    """
    uid = None
    if 'id' in session:
        # Locally logged in
        uid = session['id']
    elif hasattr(request, 'oauth'):
        # Remote OAuth - 'id' lives in request.oauth.user.id:
        uid = request.oauth.user.id
    if uid:
        return User.query.get(uid)
    return None


def get_user(uid):
    return User.query.get(uid)


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(50), unique=True)
    description = db.Column(db.Text)


class UserRoles(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('users.id',
        ondelete='CASCADE'))
    role_id = db.Column(db.Integer(), db.ForeignKey('roles.id',
        ondelete='CASCADE'))

    __table_args__ = (UniqueConstraint('user_id', 'role_id',
        name='_user_role'),)


def add_static_data(db):
    """Seed database with default static data"""
    db.session.add(Role(name='patient',
            description='Default role for all patients, may only view '
            'their own patient data'))
    db.session.add(Role(name='admin',
            description='Administrator privledges, i.e. carte blanche'))
    db.session.add(Role(name='application_developer',
            description='Gives users permission to add/view/edit '
            'Central Services applications'))
    db.session.commit()
