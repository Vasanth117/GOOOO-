# CI/CD and DevOps Setup Guide for GOO Platform

This document outlines the steps required to get the complete CI/CD and DevOps pipeline running for this project.

## Workflow Overview
Developer Pushes Code -> GitHub -> Webhook -> Jenkins -> Code Build -> SonarQube Scan -> Quality Gate -> Trivy Scan -> Docker Build -> Docker Hub -> Update Kubernetes Manifest -> GitHub Manifest Repo -> ArgoCD -> Kubernetes Deployment -> Prometheus Metrics -> Grafana Dashboard

## Prerequisites
1. **GitHub Repository**: Your code should be hosted on GitHub.
2. **Jenkins Server**: A running Jenkins instance with the following plugins installed:
   - Git plugin
   - Pipeline plugin
   - SonarQube Scanner plugin
   - Docker Pipeline plugin
3. **SonarQube Server**: A running SonarQube server.
4. **Trivy**: Installed on the Jenkins worker/agent.
5. **Docker**: Installed on the Jenkins worker/agent.
6. **Docker Hub Account**: For storing your container images.
7. **Kubernetes Cluster**: For deploying the applications.
8. **ArgoCD**: Installed in your Kubernetes cluster.
9. **Prometheus & Grafana**: Installed in your Kubernetes cluster (e.g., using `kube-prometheus-stack`).

## Step-by-Step Setup

### 1. Configure Jenkins
1. Set up Webhooks in your GitHub repository to trigger the Jenkins pipeline on a push event.
2. In Jenkins, create a new "Pipeline" job and point it to the repository's `Jenkinsfile`.
3. Add the following Credentials in Jenkins:
   - `docker-hub-credentials` (Username with password) for Docker Hub.
   - `github-credentials` (Username with password/personal access token) for pushing manifest updates back to GitHub.
4. Configure SonarQube in Jenkins under **Manage Jenkins -> System -> SonarQube servers**. Name it `SonarQubeServer` to match the Jenkinsfile. Also, configure the "SonarQube Scanner" under Global Tool Configuration.

### 2. Docker & Container Registry
The `Jenkinsfile` is configured to build `backend` and `frontend` images and push them to Docker Hub. Make sure you update the `DOCKER_HUB_REPO_BACKEND` and `DOCKER_HUB_REPO_FRONTEND` variables in the `Jenkinsfile` with your actual Docker Hub username.

### 3. Kubernetes Manifests Repository
The Jenkins pipeline pushes updated manifests to a separate repository (or branch).
1. Create a GitHub repository named `goo-k8s-manifests` (or similar).
2. Copy the contents of the `k8s/` folder in this project to that repository.
3. Update the `MANIFEST_REPO_URL` in the `Jenkinsfile` with this new repository's URL.

### 4. Continuous Deployment with ArgoCD
1. Apply the ArgoCD application manifest to your cluster:
   ```bash
   kubectl apply -f k8s/argo-application.yaml
   ```
2. ArgoCD will now continuously monitor your manifests repository and automatically sync changes (like the image tag updates performed by Jenkins) to your Kubernetes cluster.

### 5. Monitoring (Prometheus & Grafana)
1. Ensure your backend exposes metrics at the `/metrics` endpoint (e.g., using `prometheus_client` in Python).
2. Apply the `ServiceMonitor` manifest:
   ```bash
   kubectl apply -f k8s/prometheus-service-monitor.yaml
   ```
3. Prometheus will automatically start scraping metrics from the backend service.
4. In Grafana, you can create a new dashboard and use PromQL queries (like `rate(http_requests_total[5m])`) to visualize traffic and performance.
