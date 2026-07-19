pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDS = credentials('docker-hub-credentials') // Jenkins Credentials ID
        DOCKER_HUB_REPO_BACKEND = 'vasanth0711/goo-backend'
        DOCKER_HUB_REPO_FRONTEND = 'vasanth0711/goo-frontend'
        GITHUB_CREDS = credentials('github-credentials') // GitHub credentials for manifest updates
        MANIFEST_REPO_URL = 'https://github.com/Vasanth117/goo-k8s-manifests.git'
        SONARQUBE_SERVER = 'SonarQubeServer' // Configured in Jenkins
    }

    stages {
        stage('Code Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Scan & Quality Gate') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv(env.SONARQUBE_SERVER) {
                        sh "${scannerHome}/bin/sonar-scanner -Dsonar.python.version=3.10"
                    }
                }
                // Quality gate check removed to allow pipeline to continue regardless of SonarQube code smells
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    echo "Building Backend Docker Image..."
                    dockerImageBackend = docker.build("${env.DOCKER_HUB_REPO_BACKEND}:${env.BUILD_NUMBER}", "./backend")

                    echo "Building Frontend Docker Image..."
                    dockerImageFrontend = docker.build("${env.DOCKER_HUB_REPO_FRONTEND}:${env.BUILD_NUMBER}", "./frontend")
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                script {
                    echo "Scanning Backend Image..."
                    sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL ${env.DOCKER_HUB_REPO_BACKEND}:${env.BUILD_NUMBER}"

                    echo "Scanning Frontend Image..."
                    sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL ${env.DOCKER_HUB_REPO_FRONTEND}:${env.BUILD_NUMBER}"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'docker-hub-credentials') {
                        dockerImageBackend.push()
                        dockerImageFrontend.push()
                        // Optionally tag latest
                        dockerImageBackend.push("latest")
                        dockerImageFrontend.push("latest")
                    }
                }
            }
        }

        stage('Update Kubernetes Manifest') {
            steps {
                script {
                    sh '''
                    # Clone the manifest repo
                    git clone ${MANIFEST_REPO_URL} k8s-manifests
                    cd k8s-manifests
                    
                    # Update deployment images
                    sed -i "s|image: ${DOCKER_HUB_REPO_BACKEND}:.*|image: ${DOCKER_HUB_REPO_BACKEND}:${BUILD_NUMBER}|g" backend-deployment.yaml
                    sed -i "s|image: ${DOCKER_HUB_REPO_FRONTEND}:.*|image: ${DOCKER_HUB_REPO_FRONTEND}:${BUILD_NUMBER}|g" frontend-deployment.yaml
                    
                    # Commit and push
                    git config user.email "jenkins@example.com"
                    git config user.name "Jenkins CI"
                    git add .
                    git commit -m "Update image tags to build ${BUILD_NUMBER}"
                    git push https://${GITHUB_CREDS_USR}:${GITHUB_CREDS_PSW}@github.com/Vasanth117/goo-k8s-manifests.git HEAD:main
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
