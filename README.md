# JS Research Validator Pro

A GitHub Pages-ready research validation app for instrument validation, expert scoring, Aiken's V, CVI, pilot reliability, ethics readiness, methodology alignment, manuscript checking, publication-readiness reporting, and Research Validity Passport export.

## Core workflow

Create Project → Upload Instrument → Expert Validation → Revise Items → Pilot Testing → Reliability/Validity Calculation → Ethics Check → Methodology Check → Manuscript Check → Publication Readiness Report → Download Research Validity Passport

## Included modules

- Dashboard with overall publication-readiness score
- Project manager
- Instrument upload/register module
- Instrument item builder
- Expert validator scoring matrix
- Aiken's V and I-CVI calculator
- Item-revision board
- Pilot testing and Cronbach's alpha calculator
- Ethics readiness checklist
- Methodology alignment checker
- Manuscript publication-readiness checklist
- Downloadable PDF report
- Downloadable Research Validity Passport JSON
- Admin PIN access
- Local browser storage
- Export/import backup

## Deployment on GitHub Pages

1. Create a new GitHub repository, for example `JS-Research-Validator-Pro`.
2. Upload these files to the repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
3. Open the repository settings.
4. Go to **Pages**.
5. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
6. Save.
7. Open the generated GitHub Pages link.

## Access

Default access PIN: `JS2026`

After first login, open **Admin** and change the PIN.

## Privacy and data

This first version is fully static and stores project data in the user's browser localStorage. It does not send research data to any server. For institutional multi-user deployment, connect it later to a secure backend and authenticated database.

## Recommended future upgrades

- Multi-user login with researcher, validator, ethics reviewer, statistician, and admin roles
- Cloud database with project-level permissions
- Real QR verification endpoint for Research Validity Passports
- DOCX report export
- Journal-specific reporting guideline templates
- Advanced statistics: EFA, CFA preparation, inter-rater reliability, normality checks, and missing data diagnostics
- Institutional ethics-review integration
