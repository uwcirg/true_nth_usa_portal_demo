from flask import url_for

from tests import DEFAULT_PASSWORD, TEST_USERNAME
from tests.integration_tests import IntegrationTestCase


class TestLogin(IntegrationTestCase):
    """Test class for Login integration tests"""

    def test_login_page(self):
        """Ensure login works properly"""
        driver = self.driver
        driver.get(url_for("user.login", _external=True))

        driver.find_element_by_name("email").click()
        driver.find_element_by_name("email").clear()
        driver.find_element_by_name("email").send_keys(TEST_USERNAME)
        driver.find_element_by_name("password").click()
        driver.find_element_by_name("password").clear()
        driver.find_element_by_name("password").send_keys(DEFAULT_PASSWORD)
        driver.find_element_by_xpath(
            "//input[@class='btn btn-tnth-primary btn-lg' and @value='LOG IN']").click()
        driver.find_element_by_id("tnthUserBtn").click()
        driver.find_element_by_link_text("Log Out of TrueNTH").click()

    def test_consent_after_login(self):
        self.app.config['GIL'] = True

        driver = self.driver
        driver.get(url_for("gil.home", _external=True))
        driver.find_element_by_xpath("(.//*[normalize-space(text()) and normalize-space(.)='Menu'])[1]/following::a[2]").click()
        driver.find_element_by_name("email").click()
        driver.find_element_by_name("email").clear()
        driver.find_element_by_name("email").send_keys(TEST_USERNAME)
        driver.find_element_by_name("password").clear()
        driver.find_element_by_name("password").send_keys(DEFAULT_PASSWORD)
        driver.find_element_by_id("btnLogin").click()
        driver.find_element_by_xpath("(.//*[normalize-space(text()) and normalize-space(.)='General Terms of Use'])[1]/following::i[1]").click()
        driver.find_element_by_xpath("(.//*[normalize-space(text()) and normalize-space(.)='General Terms of Use'])[1]/following::i[2]").click()
        driver.find_element_by_id("next").click()
        driver.find_element_by_id("firstname").clear()
        driver.find_element_by_id("firstname").send_keys("Test")
        driver.find_element_by_id("lastname").clear()
        driver.find_element_by_id("lastname").send_keys("User")
        driver.find_element_by_id("date").click()
        driver.find_element_by_id("month").click()
        driver.find_element_by_xpath("(.//*[normalize-space(text()) and normalize-space(.)='(optional)'])[1]/following::option[11]").click()
        driver.find_element_by_id("year").click()
        driver.find_element_by_id("year").clear()
        driver.find_element_by_id("year").send_keys("1988")
        driver.find_element_by_xpath("(.//*[normalize-space(text()) and normalize-space(.)='Tell us a little about yourself.'])[1]/following::div[1]").click()
        driver.find_element_by_id("role_patient").click()
        driver.find_element_by_id("next").click()
        driver.find_element_by_id("biopsy_no").click()
        driver.find_element_by_id("next").click()
        driver.find_element_by_id("stateSelector").click()
        Select(driver.find_element_by_id("stateSelector")).select_by_visible_text("Washington")
        driver.find_element_by_xpath("(.//*[normalize-space(text()) and normalize-space(.)='Your clinic of care.'])[1]/following::option[12]").click()
        driver.find_element_by_id("102_org").click()
        driver.find_element_by_xpath("(.//*[normalize-space(text()) and normalize-space(.)='UWMC'])[1]/following::label[1]").click()
        driver.find_element_by_id("updateProfile").click()
        driver.find_element_by_xpath("(.//*[normalize-space(text()) and normalize-space(.)='Log Out'])[1]/following::figure[1]").click()
        driver.find_element_by_link_text("Log Out").click()
