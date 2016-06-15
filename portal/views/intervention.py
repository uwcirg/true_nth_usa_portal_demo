"""Intervention API view functions"""
from flask import abort, Blueprint, jsonify
from flask import request
from flask_user import roles_required
import json

from ..audit import auditable_event
from ..models.intervention import INTERVENTION, UserIntervention
from ..models.user import current_user
from ..models.role import ROLE
from ..models.relationship import RELATIONSHIP
from ..extensions import oauth
from ..extensions import db
from ..models.intervention_strategies import AccessStrategy


intervention_api = Blueprint('intervention_api', __name__, url_prefix='/api')


@intervention_api.route('/intervention/<string:intervention_name>',
                        methods=('PUT',))
@oauth.require_oauth()
@roles_required(ROLE.SERVICE)
def intervention_set(intervention_name):
    """Update user access to the named intervention

    Submit a JSON doc with the user_id and access {granted|forbidden}
    for the named intervention.

    Only available as a service account API - the named intervention
    must be associated with the service account sponsor.

    NB - interventions have a global 'public_access' setting.  Only
    when unset are individual accounts consulted.

    ---
    operationId: setInterventionAccess
    tags:
      - Intervention
    produces:
      - application/json
    parameters:
      - name: intervention_name
        in: path
        description: TrueNTH intervention_name
        required: true
        type: string
      - in: body
        name: body
        schema:
          id: intervention_access
          required:
            - user_id
            - access
            - card_html
            - provider_html
          properties:
            user_id:
              type: string
              description:
                Truenth user identifier referring to whom the request applies
            access:
              type: string
              enum:
                - forbidden
                - granted
            card_html:
              type: string
              description:
                Custom HTML for display on intervention card for the
                referenced user
            provider_html:
              type: string
              description:
                Custom HTML for display in patient list for care providers,
                as seen on the /patients view, specific to the referenced
                user..
    responses:
      200:
        description: successful operation
        schema:
          id: response
          required:
            - message
          properties:
            message:
              type: string
              description: Result, typically "ok"
      401:
        description:
          if missing valid OAuth SERVICE token or the service user owning
          the token isn't sponsored by the named intervention owner.

    """
    intervention = getattr(INTERVENTION, intervention_name)
    if not intervention:
        abort (404, 'no such intervention {}'.format(intervention_name))

    # service account being used must belong to the intervention owner
    if not (intervention.client and intervention.client.user.has_relationship(
        relationship_name=RELATIONSHIP.SPONSOR, other_user=current_user())):
        abort(401, "Service account sponsored by intervention owner required")

    if not request.json or 'user_id' not in request.json or\
            "access" not in request.json:
        abort(400, "Requires JSON defining at least user_id and access")
    user_id = request.json.get('user_id')
    current_user().check_role(permission='edit', other_id=user_id)

    ui = UserIntervention.query.filter_by(
        user_id=user_id, intervention_id=intervention.id).first()
    if not ui:
        ui = UserIntervention(user_id=user_id,
                              intervention_id=intervention.id)
        db.session.add(ui)
    ui.access = request.json.get('access')
    ui.card_html = request.json.get('card_html')
    ui.provider_html = request.json.get('provider_html')
    db.session.commit()
    auditable_event("updated {0} using: {1}".format(
        intervention.description, json.dumps(request.json)),
        user_id=current_user().id)
    return jsonify(message='ok')


@intervention_api.route(
    '/intervention/<string:intervention_name>/access_rule')
@roles_required(ROLE.ADMIN)
def intervention_rule_list(intervention_name):
    """Return the list of intervention rules for named intervention

    NB - not documenting in swagger at this time, intended for internal use
    only.

    """
    intervention = getattr(INTERVENTION, intervention_name)
    if not intervention:
        abort (404, 'no such intervention {}'.format(intervention_name))
    rules = [x.as_json() for x in intervention.access_strategies]
    return jsonify(rules=rules)


@intervention_api.route(
    '/intervention/<string:intervention_name>/access_rule', methods=('POST',))
@oauth.require_oauth()
@roles_required([ROLE.ADMIN, ROLE.SERVICE])
def intervention_rule_set(intervention_name):
    """POST an access rule to the named intervention

    Submit a JSON doc with the access strategy details to include
    for the named intervention.

    Only available as a service account API - the named intervention
    must be associated with the service account sponsor.

    NB - interventions have a global 'public_access' setting.  Only
    when unset are access rules consulted.

    NB - not documenting in swagger at this time, intended for internal use
    only.

    """
    intervention = getattr(INTERVENTION, intervention_name)
    if not intervention:
        abort (404, 'no such intervention {}'.format(intervention_name))

    if not request.json or 'function_details' not in request.json:
        abort(400, "Requires JSON with well defined access strategy")
    access_strategy = AccessStrategy.from_json(request.json)
    intervention.access_strategies.append(access_strategy)
    db.session.commit()
    auditable_event("added {} to intervention {}".format(
        access_strategy, intervention.description), user_id=current_user().id)
    return jsonify(message='ok')
