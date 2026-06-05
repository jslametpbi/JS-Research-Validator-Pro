# JS Research Validation Pro

A GitHub Pages-ready static web app for integrated research validation.

## Version
2.0 Role-Based Metadata Passport

## Main Features

- Role-based access for Admin, Project Applicant/Researcher, and Validator
- Project applicant registration
- Validator registration with detailed professional metadata
- Validator digital signature upload and drawing pad
- Admin verification for validators and project stages
- Automatic unique project number generation
- Integrated first-input project metadata used by all later stages
- Instrument registration and item management
- Expert validation scoring across relevance, clarity, construct alignment, language, cultural fit, and ethical sensitivity
- Automatic Aiken's V, I-CVI, and agreement calculation
- Detailed pilot testing and reliability tools:
  - Cronbach's Alpha
  - KR-20
  - Inter-rater agreement and Cohen's Kappa
  - Test-retest Pearson r
  - Split-half and Spearman-Brown
  - Qualitative trustworthiness evidence
  - R&D practicality/usability evidence
- Ethics, methodology, and manuscript readiness checklists
- Detailed report and Research Validity Passport
- Real QR code for public report/passport URL
- Standalone public HTML report export
- JSON backup/export/import
- Local browser storage, no backend required

## Default Admin PIN

```text
JS2026
```

You can change this in **Admin Verification → System Backup & Admin PIN**.

## GitHub Pages Deployment

1. Extract the ZIP.
2. Upload the extracted files to a public GitHub repository.
3. Make sure `index.html`, `styles.css`, `app.js`, and `README.md` are in the root of the repository.
4. Go to **Settings → Pages**.
5. Select **Deploy from a branch**.
6. Choose branch **main** and folder **/root**.
7. Save.
8. Open the published GitHub Pages link.

## Important Notes

This is a static app. Data is saved in the browser's local storage. To move data to another computer or browser, use **Admin → Export All Data** and then **Import JSON**.

The public QR report uses an encoded, login-free report summary inside the URL. For a permanent public report page with full signature images, download the standalone public HTML report and upload it to your GitHub Pages repository.
