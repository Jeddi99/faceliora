/* Faceliora site configuration. ONE value to set for the LINE button.
 * LINE_OA_URL: full https link to the Faceliora LINE Official Account.
 *   "" (empty)  -> the "Add Faceliora on LINE" button is NOT rendered anywhere.
 *   "https://line.me/R/ti/p/@117hipgc" -> button appears on Contact (clinic row) and the Clinic page.
 * Only https:// links are accepted; anything else is ignored. No network request is made here.
 * LEAD_ENDPOINT_URL: https URL of the Google Apps Script Web App that receives the clinic demo form (/th/demo/, /en/demo/).
 *   "" (empty)  -> the form shows a notice (LINE @117hipgc / email), keeps what was typed, and the submit button is disabled. Nothing is sent. */
window.FACELIORA_SITE_CONFIG = {
  LINE_OA_URL: "https://line.me/R/ti/p/@117hipgc",
  LEAD_ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbzzfp7kq6CA_mQ7JjXUfkSScddsijoGgzcJ2nlNjfcFe0Bqh40wsZWCco_PLr-Y_bF1/exec"
};
