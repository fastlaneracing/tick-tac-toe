# Setup and Publishing

This app is a static browser game, so the recommended Azure hosting option is **Azure Static Web Apps**.

Azure Static Web Apps is a good fit because the game is plain HTML, CSS, JavaScript, and SVG assets. It does not need a backend server to run.

## Recommended Publishing Path

1. Put the app in GitHub.
2. Create an Azure Static Web App.
3. Connect it to the GitHub repo.
4. Configure it as a plain static site.
5. Add `www.swamppuppypark.com` as a custom domain.
6. Point DNS records from the domain to Azure.
7. Optionally redirect `swamppuppypark.com` to `www.swamppuppypark.com`.

## Push the App to GitHub

Create a GitHub repo, then run these commands from this project folder:

```powershell
git add .
git commit -m "Initial turtle alligator tic tac toe app"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin master
```

Replace `YOUR-USERNAME` and `YOUR-REPO` with the real GitHub account and repository name.

## Create the Azure Static Web App

In the Azure Portal:

1. Search for **Static Web Apps**.
2. Click **Create**.
3. Choose the subscription and resource group.
4. Name it something like `swamppuppypark`.
5. Choose a region close to you.
6. Set the deployment source to **GitHub**.
7. Sign in to GitHub and select the repo and branch.

Use these build settings for this no-build static app:

```text
App location: /
Api location: leave blank
Output location: leave blank
Build command: leave blank
Skip app build: true
```

If Azure asks for a build preset, choose **Custom** or **HTML** if available.

If Azure created a GitHub Actions workflow, open the file under `.github/workflows/` and make sure the Static Web Apps step uses:

```yaml
app_location: "/"
api_location: ""
output_location: ""
skip_app_build: true
skip_api_build: true
```

With `skip_app_build: true`, Azure deploys the files from `app_location` directly.

If the deployment fails with this message:

```text
Could not find either 'build' or 'build:azure' node under 'scripts' in package.json.
```

then Azure is still trying to run a Node build. Fix the GitHub Actions workflow so the deploy step has `skip_app_build: true` and `output_location: ""`, then commit and push the workflow file.

The workflow file must be a complete GitHub Actions workflow, not just the four build settings. It should include `name`, `on`, `jobs`, `steps`, and the `Azure/static-web-apps-deploy@v1` action.

This repo currently uses the `master` branch. The workflow should listen to `master` unless the repo is renamed to use `main`.

As a fallback, the project also has a simple `build` script:

```json
"build": "echo No build needed"
```

That fallback lets Azure finish if you choose not to skip the build, but the cleaner setting for this project is still to skip the app build.

## Test the Azure URL

After deployment, Azure gives the app a generated URL like:

```text
https://some-random-name.azurestaticapps.net
```

Open that URL and confirm:

- The page loads.
- The grid accepts clicks.
- Turtle and alligator pieces appear.
- Computer mode works.
- Two-player mode works.

## Connect `www.swamppuppypark.com`

In Azure:

1. Open the Static Web App.
2. Go to **Custom domains**.
3. Click **Add**.
4. Add `www.swamppuppypark.com`.
5. Follow Azure's DNS instructions.

For a `www` subdomain, the DNS record is usually a CNAME:

```text
Type: CNAME
Name: www
Value: your-static-web-app.azurestaticapps.net
```

Use the exact value Azure gives you. Azure may also ask for a TXT record to validate domain ownership.

If DNS is hosted in Azure DNS, Azure can help create the needed DNS records. If DNS is hosted somewhere else, such as GoDaddy, Cloudflare, Namecheap, or Squarespace, create the records in that provider's DNS settings.

## Handle the Root Domain

The root domain is:

```text
swamppuppypark.com
```

The easiest setup is:

```text
www.swamppuppypark.com -> Azure Static Web App
swamppuppypark.com -> redirect to www.swamppuppypark.com
```

How the redirect works depends on where the domain is managed:

- Cloudflare can do this with a redirect rule.
- Some registrars offer domain forwarding.
- Azure DNS by itself manages DNS records, but does not perform HTTP redirects.
- Azure Static Web Apps also supports apex/root domains, but the required record depends on the DNS provider.

## Useful Links

- Azure Static Web Apps overview: https://azure.microsoft.com/en-us/products/app-service/static/
- Static Web Apps custom domains: https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain
- Custom domain with Azure DNS: https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain-azure-dns
- Custom domain with external DNS: https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain-external
