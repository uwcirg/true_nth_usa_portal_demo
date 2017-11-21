"""SitePersistence Module"""
from collections import defaultdict

from flask import current_app
import json
import os

from .config import SITE_CFG
from ..database import db
from ..models.app_text import AppText
from ..models.communication_request import CommunicationRequest
from ..models.fhir import FHIR_datetime
from ..models.intervention import Intervention, INTERVENTION
from ..models.intervention_strategies import AccessStrategy
from ..models.organization import Organization
from ..models.questionnaire import Questionnaire
from ..models.questionnaire_bank import QuestionnaireBank
from ..models.research_protocol import ResearchProtocol
from ..models.scheduled_job import ScheduledJob
from .model_persistence import export_model, import_model, persistence_filename


class SitePersistence(object):
    """Manage import and export of dynamic site data"""

    VERSION = '0.1'

    def _log(self, msg):
        current_app.logger.info(msg)

    def __write__(self, data, target_dir):
        self.filename = persistence_filename(target_dir=target_dir)
        if data:
            with open(self.filename, 'w') as f:
                f.write(json.dumps(data, indent=2, sort_keys=True))
            self._log("Wrote site persistence to `{}`".format(self.filename))

    def __read__(self):
        self.filename = persistence_filename()
        with open(self.filename, 'r') as f:
            data = json.load(f)
        return data

    def __header__(self, data):
        data['resourceType'] = 'Bundle'
        data['id'] = 'SitePersistence v{}'.format(self.VERSION)
        data['meta'] = {'fhir_comments': [
            "export of dynamic site data from host",
            "{}".format(current_app.config.get('SERVER_NAME'))],
            'lastUpdated': FHIR_datetime.now()}
        data['type'] = 'document'
        return data

    def __verify_header__(self, data):
        """Make sure header conforms to what we're looking for"""
        if data.get('resourceType') != 'Bundle':
            raise ValueError("expected 'Bundle' resourceType not found")
        if data.get('id') != 'SitePersistence v{}'.format(self.VERSION):
            raise ValueError("unexpected SitePersistence version {}".format(
                self.VERSION))

    def export(self, dir):
        """Generate single JSON file defining dynamic site objects

        :param dir: used to name a non-default target directory for export files

        Export dynamic data, such as Organizations and Access Strategies for
        import into other sites.  This does NOT export values expected
        to live in the site config file or the static set generated by the seed
        managment command.

        To import the data, use the seed command as defined in manage.py
        """
        d = self.__header__({})
        d['entry'] = []

        # The following model classes write to independent files
        for model in (
                Organization, Intervention, AccessStrategy, Questionnaire,
                QuestionnaireBank, AppText, CommunicationRequest,
                ResearchProtocol):
            export_model(model, target_dir=dir)


        # Add site.cfg
        config_data = read_site_cfg()
        d['entry'].append(config_data)

        self.__write__(d, target_dir=dir)

    def import_(self, keep_unmentioned):
        """If persistence file is found, import the data

        :param keep_unmentioned: if True, unmentioned data, such as
            an organization or intervention in the current database
            but not in the persistence file, will be left in place.
            if False, any unmentioned data will be purged as part of
            the import process.

        """
        data = self.__read__()
        self.__verify_header__(data)

        # Fragile design requires items are imported in order
        # Referenced objects must exist before import will succeed.

        objs_by_type = defaultdict(list)
        for entry in data['entry']:
            objs_by_type[entry['resourceType']].append(entry)

        # ResearchProtocols before Orgs (Orgs point to RPs)
        import_model(
            ResearchProtocol, objs_by_type, 'research_protocols_id_seq',
            lookup_field='name', keep_unmentioned=keep_unmentioned)

        # Orgs before all else:
        import_model(
            Organization, objs_by_type, 'organizations_id_seq',
            keep_unmentioned=keep_unmentioned)

        # Questionnaires:
        import_model(
            Questionnaire, objs_by_type, 'questionnaires_id_seq',
            lookup_field='name', keep_unmentioned=keep_unmentioned)

        # QuestionnaireBanks:
        import_model(
            QuestionnaireBank, objs_by_type, 'questionnaire_banks_id_seq',
            lookup_field='name', keep_unmentioned=keep_unmentioned)

        # Interventions
        import_model(
            Intervention, objs_by_type, 'interventions_id_seq',
            lookup_field='name', keep_unmentioned=keep_unmentioned)

        # Access rules next
        import_model(
            AccessStrategy, objs_by_type, 'access_strategies_id_seq',
            keep_unmentioned=keep_unmentioned)

        # CommunicationRequest depends on QuestionnaireBanks
        import_model(
            CommunicationRequest, objs_by_type,
            'communication_requests_id_seq',
            lookup_field='identifier',
            keep_unmentioned=keep_unmentioned)

        # App Text shouldn't be order dependent, now is good.
        import_model(
            AppText, objs_by_type,
            'apptext_id_seq',
            lookup_field='name',
            keep_unmentioned=keep_unmentioned)

        # ScheduledJobs shouldn't be order dependent, now is good.
        import_model(
            ScheduledJob, objs_by_type,
            'scheduled_jobs_id_seq',
            lookup_field='name',
            keep_unmentioned=keep_unmentioned)

        # Config isn't order dependent, now is good.
        assert len(objs_by_type[SITE_CFG]) < 2
        for c in objs_by_type[SITE_CFG]:
            write_site_cfg(c)

        db.session.commit()

        self._log("SitePersistence import complete")


def read_site_cfg():
    cfg_file = os.path.join(current_app.instance_path, SITE_CFG)
    with open(cfg_file, 'r') as fp:
        results = [line for line in fp.readlines()]
    # Package for inclusion
    d = {"resourceType": SITE_CFG,
         "results": results}
    return d


def write_site_cfg(data):
    cfg_file = os.path.join(current_app.instance_path, SITE_CFG)
    assert data.get('resourceType') == SITE_CFG
    with open(cfg_file, 'w') as fp:
        for line in data['results']:
            fp.write(line)
