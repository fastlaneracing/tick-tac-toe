# Setup and Publishing

This app is a static Swamp Puppy Park website with a linked browser game, so the recommended Azure hosting option is **Azure Static Web Apps**.

Azure Static Web Apps is a good fit because the site is plain HTML, CSS, JavaScript, and SVG assets. It does not need a backend server to run.

This repo now also includes a simple **AKS container deployment path** for training. That path keeps the existing tiny Node server and packages the app into a container image that can run in Azure Kubernetes Service.

## Current Handoff Status

This section is here so a future session can resume without rediscovering the setup.

Current known state:

- the shared AKS platform is already deployed from the Terraform lab repo
- the AKS cluster is already deployed from the Terraform lab repo
- the target AKS resource group is `rg-main-akslab`
- the target AKS cluster is `aks-main-akslab`
- the target shared ACR is `acrmainaksshared`
- this repo is the app we want to deploy next

That means the current task is application rollout, not AKS infrastructure creation.

## Immediate Next Steps For This Repo

### Required Local Tools

Before you run the AKS deployment steps from this repo, make sure these tools are installed on your machine:

- Azure CLI
- `kubectl`
- Docker Desktop or another working Docker engine

Quick checks:

```powershell
az version
kubectl version --client
docker version
```

If PowerShell says a command is not recognized, that tool is not installed yet or is not on your `PATH`.

### What Docker Is

Docker is the tool that builds this project into a container image.

In this repo:

- [Dockerfile](</c:/devops/tick-tac-toe/Dockerfile>) defines how the app is packaged
- Docker builds the image
- ACR stores the image
- AKS pulls and runs the image

So the simple mental model is:

- Docker builds the package
- ACR stores the package
- `kubectl` tells AKS to run the package

### How to Verify Docker

Run:

```powershell
docker version
docker info
```

Good signs:

- `docker version` shows both client and server sections
- `docker info` returns engine details

The best quick test is:

```powershell
docker run hello-world
```

That should download a small test image, run it, print a success message, and exit.

### How to Install Docker if Needed

On this Windows-based lab machine, the usual install path is Docker Desktop for Windows.

Basic flow:

1. download Docker Desktop
2. run the installer
3. keep the WSL 2 backend option enabled unless you have a specific reason to choose Hyper-V
4. finish installation
5. start Docker Desktop
6. return to PowerShell and verify Docker

After installation, verify:

```powershell
docker version
docker run hello-world
```

If Docker seems installed but commands fail, check:

- Docker Desktop is running
- WSL is installed and working
- virtualization is enabled
- you opened a new PowerShell window after installation

### What `kubectl` Is

`kubectl` is the Kubernetes command-line tool.

It is not a normal desktop app with a graphical window. It is a terminal command you use to control a Kubernetes cluster.

In this repo, we use `kubectl` to:

- connect your local machine to the AKS cluster context
- apply the Kubernetes YAML files under `k8s/`
- check whether the pods started successfully
- inspect services, logs, and rollout status

If `kubectl` is missing, the simplest install path for this Azure lab is usually:

```powershell
az aks install-cli
```

Then verify it:

```powershell
kubectl version --client
```

### Why We Need `kubectl`

Terraform created the AKS cluster itself, but Terraform is not what we are using here to deploy the Swamp Puppy Park app into Kubernetes.

The app rollout uses:

- Docker to package the site into a container image
- ACR to store that image
- `kubectl` to tell AKS to run the image

So if Docker is the packaging tool, `kubectl` is the cluster control tool.

From `C:\devops\tick-tac-toe`, the next deployment flow is:

```powershell
az aks get-credentials --resource-group rg-main-akslab --name aks-main-akslab --overwrite-existing
kubectl get nodes

az acr login --name acrmainaksshared
docker build -t acrmainaksshared.azurecr.io/swamp-puppy-park:latest .
docker push acrmainaksshared.azurecr.io/swamp-puppy-park:latest

kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\deployment.yaml
kubectl apply -f .\k8s\service.yaml

kubectl rollout status deployment/swamp-puppy-park -n swamp-puppy-park
kubectl get pods -n swamp-puppy-park
kubectl get svc -n swamp-puppy-park
```

### What Each Step Is Doing

#### 1. Connect `kubectl` to the AKS Cluster

Use:

```powershell
az aks get-credentials --resource-group rg-main-akslab --name aks-main-akslab --overwrite-existing
kubectl config current-context
kubectl get nodes
```

Why:

- this imports the AKS cluster credentials into your local kubeconfig
- this confirms you are targeting the correct cluster before deploying

Important after an AKS cluster rebuild or redeploy:

- if the AKS cluster was destroyed and recreated, your local kubeconfig may still point to the old API server hostname
- if `kubectl apply` fails with an error like `failed to download openapi` or `lookup <old-aks-hostname>: no such host`, the problem is usually stale local cluster credentials, not the files under `k8s/`
- the old API server URL is stored in your local kubeconfig, usually at `C:\Users\<your-user>\.kube\config`
- rerun `az aks get-credentials --resource-group rg-main-akslab --name aks-main-akslab --overwrite-existing` to refresh the cluster `server:` entry before trying `kubectl apply` again

Useful checks:

```powershell
kubectl config current-context
kubectl config view --minify
kubectl config view --minify -o jsonpath="{.clusters[0].cluster.server}"
```

Success looks like:

- the context updates successfully
- `kubectl get nodes` shows ready nodes

#### 2. Build the Container Image

Use:

```powershell
docker build -t acrmainaksshared.azurecr.io/swamp-puppy-park:latest .
```

Why:

- AKS runs container images, not raw project folders
- this packages `server.js`, the HTML files, and `src/` into a runnable image

Success looks like:

- Docker finishes the build successfully
- the final image tag is `acrmainaksshared.azurecr.io/swamp-puppy-park:latest`

#### 3. Push the Image to ACR

Use:

```powershell
az acr login --name acrmainaksshared
docker push acrmainaksshared.azurecr.io/swamp-puppy-park:latest
```

Why:

- the AKS cluster pulls the image from Azure Container Registry
- if the image only exists on your machine, the cluster cannot deploy it

Success looks like:

- ACR login succeeds
- Docker push completes and uploads the image layers

#### 4. Apply the Kubernetes Manifests

Use:

```powershell
kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\deployment.yaml
kubectl apply -f .\k8s\service.yaml
```

Why:

- `namespace.yaml` creates the app namespace
- `deployment.yaml` creates the app pods and tells Kubernetes which image to run
- `service.yaml` creates the public `LoadBalancer` service

Success looks like:

- resources are created or reported as unchanged
- pods start appearing in namespace `swamp-puppy-park`

#### 5. Wait for the Load Balancer and Test the Site

Use:

```powershell
kubectl rollout status deployment/swamp-puppy-park -n swamp-puppy-park
kubectl get pods -n swamp-puppy-park
kubectl get svc -n swamp-puppy-park
```

Why:

- this confirms the rollout completed
- this gives you the public IP assigned to the `LoadBalancer` service

Success looks like:

- the deployment rollout completes
- the pods are `Running`
- the service gets a real `EXTERNAL-IP` instead of `pending`

Testing:

- browse to `http://<external-ip>`
- verify the homepage loads
- verify the link to Citrus Critter Brawl works
- verify the CSS, SVG assets, and JavaScript all load correctly

Useful troubleshooting checks:

```powershell
kubectl describe deployment swamp-puppy-park -n swamp-puppy-park
kubectl describe pod -n swamp-puppy-park <pod-name>
kubectl logs -n swamp-puppy-park <pod-name>
```

After the `LoadBalancer` service gets an external IP, open that IP in a browser and verify:

- the Swamp Puppy Park homepage loads
- the link to Citrus Critter Brawl works
- static assets load correctly
- both AKS replicas are healthy

Recommended next refinement after the first successful rollout:

- switch the image reference from `:latest` to a real deployment tag such as `:v1` or a date-based version so rollouts and rollbacks are easier to track

## How To Update The AKS App After You Change The Site

Azure Static Web Apps updates automatically from GitHub Actions, but AKS does not automatically redeploy this app just because Git changed.

For AKS, the usual update flow is:

1. build a new container image
2. push that image to ACR
3. tell Kubernetes to use the new image, or restart the deployment so new pods pull it

### Preferred Update Flow: Use A Real Image Tag

This is the cleaner approach because you can see exactly which version is deployed and roll back more easily if needed.

From `C:\devops\tick-tac-toe`:

```powershell
az aks get-credentials --resource-group rg-main-akslab --name aks-main-akslab --overwrite-existing
az acr login --name acrmainaksshared

$tag = "v2"
docker build -t acrmainaksshared.azurecr.io/swamp-puppy-park:$tag .
docker push acrmainaksshared.azurecr.io/swamp-puppy-park:$tag
```

Then update [k8s/deployment.yaml](</c:/devops/tick-tac-toe/k8s/deployment.yaml>) so the image line uses that tag instead of `:latest`:

```yaml
image: acrmainaksshared.azurecr.io/swamp-puppy-park:v2
```

Then apply the deployment and wait for the rollout:

```powershell
kubectl apply -f .\k8s\deployment.yaml
kubectl rollout status deployment/swamp-puppy-park -n swamp-puppy-park
kubectl get pods -n swamp-puppy-park
```

After that, refresh the site in the browser and confirm the changes are live.

### Quick Update Flow: Keep Using `:latest`

If you want the fastest short-term workflow, you can keep using `:latest`.

From `C:\devops\tick-tac-toe`:

```powershell
az aks get-credentials --resource-group rg-main-akslab --name aks-main-akslab --overwrite-existing
az acr login --name acrmainaksshared

docker build -t acrmainaksshared.azurecr.io/swamp-puppy-park:latest .
docker push acrmainaksshared.azurecr.io/swamp-puppy-park:latest

kubectl rollout restart deployment/swamp-puppy-park -n swamp-puppy-park
kubectl rollout status deployment/swamp-puppy-park -n swamp-puppy-park
kubectl get pods -n swamp-puppy-park
```

That restart step matters. Even though this deployment uses `imagePullPolicy: Always`, Kubernetes will not replace already-running pods just because you pushed a new `:latest` image. The restart creates new pods, and those new pods pull the updated image.

### How To Know Which Method To Use

- Use real tags like `:v2`, `:v3`, or `:20260427-1` if you want safer repeatable deployments.
- Use `:latest` plus `kubectl rollout restart` if you want the simplest training workflow.

### Good Verification After An Update

After either update flow, check:

```powershell
kubectl get pods -n swamp-puppy-park
kubectl describe deployment swamp-puppy-park -n swamp-puppy-park
kubectl get svc -n swamp-puppy-park
```

Then open the app and verify the specific page change you made is visible.

## Recommended Publishing Path

1. Put the app in GitHub.
2. Create an Azure Static Web App.
3. Connect it to the GitHub repo.
4. Configure it as a plain static site.
5. Add `www.swamppuppypark.com` as a custom domain.
6. Point DNS records from the domain to Azure.
7. Optionally redirect `swamppuppypark.com` to `www.swamppuppypark.com`.

## AKS Training Path

If you want to run this app in AKS instead of Azure Static Web Apps, the repo now includes:

- `Dockerfile`
- `.dockerignore`
- `k8s/namespace.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`

This path uses the existing `server.js` static file server, so no framework build step is needed.

### Container Build Approach

The container:

- uses Node
- copies `server.js`, all root-level `.html` files, and `src/`
- listens on port `8080`
- serves the same app content you already run locally with `npm start`

If a page works in Azure Static Web Apps but returns `Not found` in AKS, check whether that file was actually copied into the container image during `docker build`.

### Build and Push to ACR

From this repo folder, after signing into Azure and ACR, build and push:

```powershell
docker build -t acrmainaksshared.azurecr.io/swamp-puppy-park:latest .
docker push acrmainaksshared.azurecr.io/swamp-puppy-park:latest
```

If you are not already logged into ACR:

```powershell
az acr login --name acrmainaksshared
```

### Deploy to AKS

After connecting `kubectl` to the cluster, apply the Kubernetes manifests:

```powershell
kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\deployment.yaml
kubectl apply -f .\k8s\service.yaml
```

Check rollout and service status:

```powershell
kubectl get pods -n swamp-puppy-park
kubectl get svc -n swamp-puppy-park
kubectl rollout status deployment/swamp-puppy-park -n swamp-puppy-park
```

The initial service is `LoadBalancer` so you can get a public IP quickly for training. Later, this can be replaced with an ingress controller and DNS.

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

## Fix an Invalid Azure Deployment Token

If the deployment fails with this message:

```text
The content server has rejected the request with: BadRequest
Reason: No matching Static Web App was found or the api key was invalid.
```

then the GitHub Actions secret does not match the Azure Static Web App deployment token, or the workflow is pointing at the wrong Static Web App.

The workflow uses this secret name:

```text
AZURE_STATIC_WEB_APPS_API_TOKEN_KIND_PEBBLE_00FE0EC0F
```

To fix it:

1. Open the Azure Portal.
2. Open the Static Web App resource for this site.
3. On the Overview page, select **Manage deployment token**.
4. Select **Reset token**.
5. Copy the new deployment token.
6. Open the GitHub repository.
7. Go to **Settings** > **Secrets and variables** > **Actions**.
8. Create or update the repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN_KIND_PEBBLE_00FE0EC0F`.
9. Paste the Azure deployment token as the value.
10. Save the secret.
11. Rerun the failed GitHub Actions workflow, or push a new commit.

If the app was deleted and recreated in Azure, always reset and re-save the token. Tokens belong to a specific Static Web App.

If the deployment fails with this message:

```text
deployment_token was not provided.
The deployment_token is required for deploying content.
```

then GitHub does not have a secret with the exact name the workflow is using, or the secret has no value.

For this repo, the workflow expects this exact repository secret:

```text
AZURE_STATIC_WEB_APPS_API_TOKEN_KIND_PEBBLE_00FE0EC0F
```

Check GitHub:

1. Open the GitHub repository.
2. Go to **Settings** > **Secrets and variables** > **Actions**.
3. Under **Repository secrets**, confirm `AZURE_STATIC_WEB_APPS_API_TOKEN_KIND_PEBBLE_00FE0EC0F` exists.
4. If it does not exist, create it.
5. If it exists, update it with a freshly copied Azure deployment token.

Do not put the token in `setup.md`, the workflow file, or any committed file. It must be stored as a GitHub Actions secret.

If GitHub has a different Azure-generated secret name, update the workflow to use that exact secret name.

The workflow includes a safe preflight check that prints only whether the token is available. It never prints the token value.

If the preflight check says the token is missing even though the repository secret exists, check:

- The workflow run is from the same GitHub repository where the secret is stored.
- The workflow run is from the `master` branch.
- The workflow run is not from a pull request opened from a fork.
- The secret is under **Repository secrets**, not only under **Environment secrets**.
- The secret name has no extra spaces or missing characters.
- The secret value was saved after copying the latest Azure deployment token.

If the preflight check passes but Azure still says:

```text
No matching Static Web App was found or the api key was invalid.
```

then GitHub is passing a token, but Azure does not accept the token value. Reset the deployment token from the exact Static Web App resource that should host this site, then paste that new value into the GitHub secret.

Also check the Azure Static Web App **Overview** page. If Azure shows a workflow file name or branch, it should match this repository's workflow file and branch:

```text
.github/workflows/azure-static-web-apps-kind-pebble-00fe0ec0f.yml
master
```

If Azure shows a different workflow file or branch, update the Azure deployment configuration or recreate the Static Web App connection from Azure using this GitHub repository and the `master` branch.

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

- The Swamp Puppy Park homepage loads.
- The homepage Tickets and Buy Tickets links open `tickets.html`.
- The event sections are reachable.
- The Citrus Critter Brawl link opens `game.html`.
- The game grid accepts clicks.
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

## Fix Custom Domain SSL Warnings

Azure Static Web Apps automatically creates free SSL/TLS certificates for custom domains, but certificate provisioning can lag behind custom domain validation.

If `www.swamppuppypark.com` is verified but the browser still says the site is not secure:

1. Make sure the browser address starts with `https://www.swamppuppypark.com`.
2. In Azure Portal, open the Static Web App.
3. Go to **Custom domains**.
4. Confirm `www.swamppuppypark.com` shows as validated and does not show a certificate error.
5. Wait for certificate provisioning if the domain was just added. It can take time after validation.
6. Confirm DNS still has the `www` CNAME pointing to the Azure Static Web Apps default hostname.
7. If using Cloudflare or another proxy, temporarily set the DNS record to DNS-only while Azure issues the certificate.
8. If the certificate is still not issued after a long wait, remove and re-add the custom domain in Azure, then revalidate DNS.

This app uses relative asset URLs, so mixed content should not be the cause unless future changes add hard-coded `http://` links.

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
