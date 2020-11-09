"""State machine implementation for EMPRO study triggers

See also:
    [IRONMAN EMPRO Study Experience](https://promowiki.movember.com/display/ISS/Product+Development+-+IRONMAN+EMPRO+Study)
"""
import copy
from flask import current_app
from statemachine import StateMachine, State
from statemachine.exceptions import TransitionNotAllowed

from .empro_domains import DomainManifold
from .models import TriggerState
from ..database import db
from ..timeout_lock import LockTimeout, TimeoutLock

EMPRO_STUDY_ID = 1
EMPRO_LOCK_KEY = "empro-trigger-state-lock-{user_id}"


class EMPRO_state(StateMachine):
    """States a user repeatedly transitions through as an EMPRO participant

    States:
      - unstarted: generic pre-state; user can't yet start an EMPRO
       questionnaire.
      - due: user has completed prerequisites or the next cycle just became
       available, which displaces existing triggers, at least temporarily.
      - inprocess: system in process of evaluating users triggers
      - processed: user's completed EMPRO questionnaire(s) have been
       processed.  a list of hard and soft triggers are available.

    Transitions:
      - initially_available: called when a user qualifies for the study
      - begin_process: called on QNR submission, initiating processing
      - processed_triggers: processing of results completed; trigger state
       available
      - fired_events: trigger state has been evaluated, events (such as
       generating email for clinicians and patients) have fired.
      - next_available: called once the next EMPRO cycle becomes available

    """

    # States
    unstarted = State('unstarted', initial=True)
    due = State('due')
    inprocess = State('inprocess')
    processed = State('processed')
    triggered = State('triggered')

    # Transitions
    initial_available = unstarted.to(due)
    begin_process = due.to(inprocess)
    processed_triggers = inprocess.to(processed)
    fired_events = processed.to(triggered)
    next_available = triggered.to(due)


def enter_user_trigger_critical_section(user_id):
    """Set semaphore noting users trigger state is actively being processed

    A number of asynchronous tasks are involved in processing a users results
    and determining their trigger state.  This endpoint is used to set the
    semaphore used by other parts of the system to determine if results are
    available or still pending.

    :raises AsyncLockUnavailable: if lock for user is already present
    :raises TransitionNotAllowed: if user's current trigger state won't allow
      a transition to the ``inprocess`` state.

    """
    critical_section = TimeoutLock(key=EMPRO_LOCK_KEY.format(user_id=user_id))
    critical_section.__enter__()

    try:
        ts = users_trigger_state(user_id)
        sm = EMPRO_state(ts)
        sm.begin_process()
        # Record the historical transformation via insert.
        ts.insert(from_copy=True)
    except TransitionNotAllowed as tna:
        critical_section.__exit__(None, None, None)
        raise tna


def users_trigger_state(user_id):
    """Obtain latest trigger state for given user

    Returns latest TriggerState row for user or creates transient if not
     found.

    :returns TriggerState: with ``state`` attribute meaning:
      - unstarted: no info avail for user
      - due: users triggers unavailable; assessment due
      - inprocess: triggers are not ready; continue to poll for results
      - processed: triggers available in TriggerState.triggers attribute
      - triggered: triggers available in TriggerState.triggers attribute

    """
    # if semaphore is locked for user, return "inprocess"
    semaphore = TimeoutLock(key=EMPRO_LOCK_KEY.format(user_id=user_id))
    if semaphore.is_locked():
        return TriggerState(user_id=user_id, state='inprocess')

    ts = TriggerState.query.filter(
        TriggerState.user_id == user_id).order_by(
        TriggerState.timestamp.desc()).first()
    if not ts:
        ts = TriggerState(user_id=user_id, state='unstarted')
    return ts


def initiate_trigger(user_id):
    """Call when EMPRO becomes available for user"""
    ts = users_trigger_state(user_id)
    if ts.state == 'due':
        # Allow idempotent call - skip out if in correct state
        return ts

    # ... or attempt transition
    sm = EMPRO_state(ts)
    sm.initial_available()

    # Record the historical transformation via insert if new
    if ts.id is None:
        ts.insert()
    return ts


def evaluate_triggers(qnr):
    """Process state for given QuestionnaireResponse

    Complicated set of business rules used to determine trigger state.
    Look to the user's other QuestionnaireResponses and Observations
    generated to determine user's trigger state for each respective
    response period.

    Business rules defined at:
     https://promowiki.movember.com/display/ISS/Trigger+Logic

    :param qnr: QuestionnaireResponse to process as "current"
    :return: None

    """
    try:
        # first, confirm state transition is allowed - raises if not
        ts = users_trigger_state(qnr.subject_id)
        sm = EMPRO_state(ts)
        sm.begin_process()

        # bring together and evaluate available data for triggers
        dm = DomainManifold(qnr)
        ts.triggers = dm.eval_triggers()
        ts.questionnaire_response_id = qnr.id

        # transition and persist state
        sm.processed_triggers()
        ts.insert(from_copy=True)

    except (TransitionNotAllowed, LockTimeout) as e:
        current_app.logger.exception(e)
        raise e

    finally:
        # All done, release semaphore for this user
        critical_section = TimeoutLock(key=EMPRO_LOCK_KEY.format(
            user_id=qnr.subject_id))
        critical_section.__exit__(None, None, None)


def fire_trigger_events():
    """Typically called as a celery task, fire any pending events

    After questionnaire responses and resulting observations are evaluated,
    a celery job call lands here to seek out and executed any appropriate
    events from the user's trigger state.  Said rows will be in the
    'processed' state.

    Actions are recorded in trigger_states.triggers and the row's state
    is transitioned to 'triggered'.

    """
    # as a job, make sure only running one concurrent instance
    NEVER_WAIT = 0
    with TimeoutLock(key='fire_trigger_events', timeout=NEVER_WAIT):
        # seek out any pending work
        for ts in TriggerState.query.filter(TriggerState.state == 'processed'):
            # necessary to make deep copy in order to update DB JSON
            triggers = copy.deepcopy(ts.triggers)
            triggers['actions'] = []
            # Emails generated for both patient and clinician/staff based
            # on hard triggers.  Patient gets 'thank you' email regardless.
            hard_trigger_list = ts.hard_trigger_list()

            # without hard triggers, user gets thank you email
            if not hard_trigger_list:
                # TODO generate and send patient thank you email
                triggers['actions'].append(
                    {"email": "patient thank you email id"})

            else:
                # TODO generate and send patient trigger info email
                triggers['actions'].append(
                    {"email": "patient trigger info email id"})

                # TODO generate and send clinician and staff email
                #  with link to user's profile - that will present
                #  QB for clinician to fill out.
                triggers['actions'].append(
                    {"email": "clinician email id"})

            # Change state, as this row has been processed.
            ts['triggers'] = triggers
            sm = EMPRO_state(ts)
            sm.fired_events()

        db.session.commit()