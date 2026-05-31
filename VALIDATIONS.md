# Game/Weather – Testing & Validation Report

This document outlines the testing process and validation results for the **Jump-Game/Weather** website. Validation was carried out using W3C validation tools and manual accessibility and responsiveness checks.

---

## HTML Validation

All main pages were validated using the **W3C HTML Validator**. Validation was performed by URI after deployment to GitHub Pages. No critical HTML errors were found.

### Validation Evidence

#### Game Page
![HTML Validation – Game Page](assets/Validations/index_html_valid.jpg)

#### Wether Page
![HTML Validation – Weather Page](assets/Validations/weather_html_valid.jpg)


---

## CSS Validation

Custom stylesheets were tested using the **W3C CSS Validator**. No errors were detected. Any warnings were related to vendor prefixes and external frameworks, which are acceptable for compatibility purposes.

### Validation Evidence

#### Game Page Stylesheet
![CSS Validation – Gaem Styles](assets/Validations/Game_CSS_valid.jpg)

#### Weather Page Stylesheet
![CSS Validation – Weather Styles](assets/Validations/Weather_CSS_valid.jpg)

#### CSS Warnings Stylesheet
![CSS Warnings](assets/Validations/Weather_CSS_valid.jpg)

---

## Accessibility Testing

Accessibility testing was carried out using a combination of **Lighthouse audits** and **manual keyboard navigation tests**.

The following checks were performed:
- Keyboard navigation using the Tab key
- Visible focus states for interactive elements
- Alt text provided for all images
- Labels correctly associated with form inputs
- Logical heading hierarchy across all pages

---

## Responsive Testing

The website was tested across multiple screen sizes using browser developer tools to ensure responsive behaviour and layout consistency.

### Breakpoints Tested [TO DO !!!]

- 320px (Mobile)
- 576px (Small devices)
- 768px (Tablets)
- 992px (Small desktops)
- 1200px (Large desktops)
- 1400px (Extra large screens)

---

## Lighthouse Testing Summary

Google Lighthouse was used to perform audits covering **Performance, Accessibility, Best Practices, and SEO**.  
Tests were run in a private browser window to minimise the impact of extensions.

Minor performance warnings were mainly related to image optimisation and third‑party frameworks (Bootstrap and Font Awesome), which are acceptable for a static Bootstrap‑based project.

Accessibility, Best Practices, and SEO scores were consistently high, confirming that the website meets modern front‑end standards.

---

## Lighthouse Report Evidence

### Game Page

#### Desktop View
![Game Page Lighthouse – Desktop](assets/Validations/Game_Desktop_lighthouse_test.png)
 
#### Mobile View
![Game Page Lighthouse – Mobile](assets/Validations/Game_mobile_lighthouse_test.png)

---

### Weather Page

#### Desktop View
![Weather Page Lighthouse – Desktop](assets/Validations/Weather_Desktop_lighthouse_test.png)

#### Mobile View
![Weather Page Lighthouse – Mobile](assets/Validations/Weather_mobile_lighthouse_test.png)

---


## Conclusion

The **Game/Weather** website meets validation, accessibility, and responsiveness requirements appropriate for a static HTML, CSS, and Bootstrap project. All core pages validated successfully, and usability testing confirms the site is accessible and responsive across devices.