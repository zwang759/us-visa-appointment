const puppeteer = require('puppeteer');

const APPOINTMENT_ID = "";
// Vancouver
const CONSULAR_ID = "95";
const REGION = "ca";
const E_MAIL = "";
const PASSWORD = "";
const CURRENT_DATE = new Date(2023, 12, 27);
const RETRY_TIMEOUT = 3 * 60 * 1000;

(async () => {
    const currentDate = CURRENT_DATE;
    const usernameInput = E_MAIL;
    const passwordInput = PASSWORD;
    const appointmentId = APPOINTMENT_ID;
    const retryTimeout = RETRY_TIMEOUT;
    const consularId = CONSULAR_ID;
    const region = REGION;

    //#region Helper functions
    async function waitForSelectors(selectors, frame, options) {
        for (const selector of selectors) {
            try {
                return await waitForSelector(selector, frame, options);
            } catch (err) {
                log(err);
            }
        }
        throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
    }

    async function scrollIntoViewIfNeeded(element, timeout) {
        await waitForConnected(element, timeout);
        const isInViewport = await element.isIntersectingViewport({threshold: 0});
        if (isInViewport) {
            return;
        }
        await element.evaluate(element => {
            element.scrollIntoView({
                block: 'center',
                inline: 'center',
                behavior: 'auto',
            });
        });
        await waitForInViewport(element, timeout);
    }

    async function waitForConnected(element, timeout) {
        await waitForFunction(async () => {
            return await element.getProperty('isConnected');
        }, timeout);
    }

    async function waitForInViewport(element, timeout) {
        await waitForFunction(async () => {
            return await element.isIntersectingViewport({threshold: 0});
        }, timeout);
    }

    async function waitForSelector(selector, frame, options) {
        if (!Array.isArray(selector)) {
            selector = [selector];
        }
        if (!selector.length) {
            throw new Error('Empty selector provided to waitForSelector');
        }
        let element = null;
        for (let i = 0; i < selector.length; i++) {
            const part = selector[i];
            if (element) {
                element = await element.waitForSelector(part, options);
            } else {
                element = await frame.waitForSelector(part, options);
            }
            if (!element) {
                throw new Error('Could not find element: ' + selector.join('>>'));
            }
            if (i < selector.length - 1) {
                element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
            }
        }
        if (!element) {
            throw new Error('Could not find element: ' + selector.join('|'));
        }
        return element;
    }

    async function waitForFunction(fn, timeout) {
        let isActive = true;
        setTimeout(() => {
            isActive = false;
        }, timeout);
        while (isActive) {
            const result = await fn();
            if (result) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error('Timed out');
    }

    async function sleep(timeout) {
        return await new Promise(resolve => setTimeout(resolve, timeout));
    }

    async function log(msg) {
        const currentDate = '[' + new Date().toLocaleString() + ']';
        console.log(currentDate, msg);
    }

    async function runLogic() {
        //#region Init puppeteer
        const browser = await puppeteer.launch();
        // Comment above line and uncomment following line to see puppeteer in action
        //const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        const timeout = 6000;
        const navigationTimeout = 10000;
        const smallTimeout = 100;
        page.setDefaultTimeout(timeout);
        page.setDefaultNavigationTimeout(navigationTimeout);
        //#endregion

        //#region Logic

        // Set the viewport to avoid elements changing places
        {
            const targetPage = page;
            await targetPage.setViewport({"width": 2078, "height": 1479})
        }

        // Go to login page
        {
            log('Going to https://ais.usvisa-info.com/en-' + region + '/niv/users/sign_in');
            const targetPage = page;
            await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/users/sign_in', {waitUntil: 'domcontentloaded'});
        }

        // Click on username input
        {
            const targetPage = page;
            const element = await waitForSelectors([["aria/Email *"], ["#user_email"]], targetPage, {
                timeout,
                visible: true
            });
            await scrollIntoViewIfNeeded(element, timeout);
            await element.click({offset: {x: 118, y: 21.453125}});
        }

        // Type username
        {
            const targetPage = page;
            const element = await waitForSelectors([["aria/Email *"], ["#user_email"]], targetPage, {
                timeout,
                visible: true
            });
            await scrollIntoViewIfNeeded(element, timeout);
            const type = await element.evaluate(el => el.type);
            if (["textarea", "select-one", "text", "url", "tel", "search", "password", "number", "email"].includes(type)) {
                await element.type(usernameInput);
            } else {
                await element.focus();
                await element.evaluate((el, value) => {
                    el.value = value;
                    el.dispatchEvent(new Event('input', {bubbles: true}));
                    el.dispatchEvent(new Event('change', {bubbles: true}));
                }, usernameInput);
            }
        }

        // Hit tab to go to the password input
        {
            const targetPage = page;
            await targetPage.keyboard.down("Tab");
        }
        {
            const targetPage = page;
            await targetPage.keyboard.up("Tab");
        }

        // Type password
        {
            const targetPage = page;
            const element = await waitForSelectors([["aria/Password"], ["#user_password"]], targetPage, {
                timeout,
                visible: true
            });
            await scrollIntoViewIfNeeded(element, timeout);
            const type = await element.evaluate(el => el.type);
            if (["textarea", "select-one", "text", "url", "tel", "search", "password", "number", "email"].includes(type)) {
                await element.type(passwordInput);
            } else {
                await element.focus();
                await element.evaluate((el, value) => {
                    el.value = value;
                    el.dispatchEvent(new Event('input', {bubbles: true}));
                    el.dispatchEvent(new Event('change', {bubbles: true}));
                }, passwordInput);
            }
        }

        // Tick the checkbox for agreement
        {
            const targetPage = page;
            const element = await waitForSelectors([["#sign_in_form > div.radio-checkbox-group.margin-top-30 > label > div"]], targetPage, {
                timeout,
                visible: true
            });
            await scrollIntoViewIfNeeded(element, timeout);
            await element.click({offset: {x: 9, y: 16.34375}});
        }

        // Click login button
        {
            const targetPage = page;
            const element = await waitForSelectors([["aria/Sign In[role=\"button\"]"], ["#new_user > p:nth-child(9) > input"]], targetPage, {
                timeout,
                visible: true
            });
            await scrollIntoViewIfNeeded(element, timeout);
            await element.click({offset: {x: 34, y: 11.34375}});
            await sleep(1000);
        }

        // Go to appointment page
        {
            log('Going to https://ais.usvisa-info.com/en-' + region + '/niv/schedule/' + appointmentId + '/appointment');
            const targetPage = page;
            await targetPage.goto('https://ais.usvisa-info.com/en-' + region + '/niv/schedule/' + appointmentId + '/appointment', {waitUntil: 'domcontentloaded'});
        }

        // Select the specified consular from the dropdown
        {
            log('Select the specified consular from the dropdown');
            const targetPage = page;
            const element = await waitForSelectors([["aria/Consular Section Appointment", "aria/[role=\"combobox\"]"], ["#appointments_consulate_appointment_facility_id"]], targetPage, {
                timeout,
                visible: true
            });
            await scrollIntoViewIfNeeded(element, timeout);
            await page.select("#appointments_consulate_appointment_facility_id", consularId);
            await sleep(1000);
        }

        // Click on date input
        {
            log('Click on date input');
            const targetPage = page;
            const element = await waitForSelectors([["aria/Date of Appointment *"], ["#appointments_consulate_appointment_date"]], targetPage, {
                timeout,
                visible: true
            });
            await scrollIntoViewIfNeeded(element, timeout);
            await element.click({offset: {x: 394.5, y: 17.53125}});
            await sleep(1000);
        }

        // Keep clicking next button until we find the first available date and click to that date
        log('Keep clicking next button until we find the first available date and click to that date');

        let foundDate;

        {
            const targetPage = page;
            while (true) {
                try {
                    const element = await waitForSelectors([["td[data-handler='selectDay']"], ["#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > table > tbody > tr > td.undefined > a"]], targetPage, {
                        timeout: smallTimeout,
                        visible: true
                    });
                    await scrollIntoViewIfNeeded(element, timeout);

                    const textContentList = await page.evaluate(() => {
                        const div = document.querySelector("#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > div > div");
                        const spans = div.querySelectorAll("span");
                        const textList = [];

                        spans.forEach(span => {
                            const text = span.textContent.trim();
                            if (text) {
                                textList.push(text);
                            }
                        });

                        return textList;
                    });

                    foundDate = new Date(`${textContentList[0]} 1, ${textContentList[1]}`);

                    if (foundDate > currentDate) {
                        log('Found date: ' + foundDate + ' is later than ' + currentDate);
                        break;
                    }

                    await page.click('#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > table > tbody > tr > td.undefined > a');

                    await sleep(1000);
                    break;
                } catch (err) {
                    log("Going to the next month");
                    const targetPage = page;
                    const element = await waitForSelectors([["aria/Next", "aria/[role=\"generic\"]"], ["#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group-last > div > a > span"]], targetPage, {
                        timeout,
                        visible: true
                    });
                    await scrollIntoViewIfNeeded(element, timeout);
                    await element.click({offset: {x: 4, y: 9.03125}});
                }
            }
        }

        if (foundDate <= currentDate) {

            log('Found date: ' + foundDate + ' is earlier than ' + currentDate);

            // Select the first available Time from the time dropdown
            {
                log('Select the first available Time from the time dropdown');
                const targetPage = page;
                const element = await waitForSelectors([["#appointments_consulate_appointment_time"]], targetPage, {
                    timeout,
                    visible: true
                });
                await scrollIntoViewIfNeeded(element, timeout);
                await page.evaluate(() => {
                    document.querySelector('#appointments_consulate_appointment_time option:nth-child(2)').selected = true;
                    const event = new Event('change', {bubbles: true});
                    document.querySelector('#appointments_consulate_appointment_time').dispatchEvent(event);
                })
                await sleep(1000);
            }

            // Click on reschedule button
            {
                log('Click on reschedule button');
                const targetPage = page;
                const element = await waitForSelectors([["aria/Reschedule"], ["#appointments_submit"]], targetPage, {
                    timeout,
                    visible: true
                });
                await scrollIntoViewIfNeeded(element, timeout);
                await element.click({offset: {x: 78.109375, y: 20.0625}});
                await sleep(1000);
            }

            // Click on submit button on the confirmation popup
            {
                log('Click on submit button on the confirmation popup');
                const targetPage = page;
                const element = await waitForSelectors([["aria/Cancel"], ["body > div.reveal-overlay > div > div > a.button.alert"]], targetPage, {
                    timeout,
                    visible: true
                });
                await scrollIntoViewIfNeeded(element, timeout);
                await page.click('body > div.reveal-overlay > div > div > a.button.alert');
                await sleep(5000);
            }
            await page.close()
            await browser.close();
            return true;
            //#endregion
        }

    }

    while (true) {
        try {
            const result = await runLogic();

            if (result) {
                log("Successfully scheduled a new appointment");
                break;
            } else {
                log("No earlier available appointment date found");
            }
        } catch (err) {
            // Swallow the error and keep running in case we encountered an error.
            log(err);
        }

        await sleep(retryTimeout);
    }
})();
