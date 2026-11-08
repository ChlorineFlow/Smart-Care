pipeline {
    agent {
        label 'smartcare-deploy'
    }

    parameters {
        string(name: 'COMMIT_SHA', defaultValue: '', description: 'Full commit SHA that passed GitHub Actions and SonarCloud')
        string(name: 'K8S_NAMESPACE', defaultValue: 'smartcare', description: 'Existing application namespace')
        string(name: 'BACKEND_DEPLOYMENT', defaultValue: 'smartcare-backend', description: 'Existing backend Deployment')
        string(name: 'BACKEND_CONTAINER', defaultValue: 'smartcare-backend', description: 'Backend container in the existing Deployment')
        string(name: 'BACKEND_SERVICE', defaultValue: 'smartcare-backend', description: 'Existing backend Service used for smoke tests')
        string(name: 'FRONTEND_DEPLOYMENT', defaultValue: 'smartcare-frontend', description: 'Existing frontend Deployment')
        string(name: 'FRONTEND_CONTAINER', defaultValue: 'smartcare-frontend', description: 'Frontend container in the existing Deployment')
        string(name: 'FRONTEND_SERVICE', defaultValue: 'smartcare-frontend', description: 'Existing frontend Service used for smoke tests')
    }

    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        skipDefaultCheckout(true)
    }

    environment {
        SOURCE_REPOSITORY = 'https://github.com/ChlorineFlow/Smart-Care.git'
        IMAGE_PREFIX = 'ghcr.io/chlorineflow/smart-care'
    }

    stages {
        stage('Validate CI commit') {
            steps {
                script {
                    if (!(params.COMMIT_SHA ==~ /[0-9a-f]{40}/)) {
                        error('COMMIT_SHA must be the full 40-character SHA supplied by the successful GitHub Actions run.')
                    }
                    env.IMAGE_TAG = params.COMMIT_SHA
                }
            }
        }

        stage('Checkout exact commit') {
            steps {
                dir('smartcare-source') {
                    deleteDir()
                    sh '''
                        set -eu
                        git init
                        git remote add origin "$SOURCE_REPOSITORY"
                        git fetch --no-tags origin main
                        git cat-file -e "$COMMIT_SHA^{commit}"
                        git checkout --detach "$COMMIT_SHA"
                        test "$(git rev-parse HEAD)" = "$COMMIT_SHA"
                    '''
                }
            }
        }

        stage('Check Jenkins build agent') {
            steps {
                sh '''
                    set -eu
                    command -v docker
                    docker info
                    command -v kubectl
                    kubectl get deployment "$BACKEND_DEPLOYMENT" --namespace="$K8S_NAMESPACE" >/dev/null
                    kubectl get deployment "$FRONTEND_DEPLOYMENT" --namespace="$K8S_NAMESPACE" >/dev/null
                    kubectl get service "$BACKEND_SERVICE" --namespace="$K8S_NAMESPACE" >/dev/null
                    kubectl get service "$FRONTEND_SERVICE" --namespace="$K8S_NAMESPACE" >/dev/null
                '''
            }
        }

        stage('Build and publish immutable images') {
            steps {
                dir('smartcare-source') {
                    withCredentials([usernamePassword(
                        credentialsId: 'smartcare-ghcr-push',
                        usernameVariable: 'GHCR_USERNAME',
                        passwordVariable: 'GHCR_TOKEN'
                    )]) {
                        sh '''
                            set -eu
                            printf '%s' "$GHCR_TOKEN" | docker login ghcr.io --username "$GHCR_USERNAME" --password-stdin
                            trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

                            docker build --pull \\
                                --label "org.opencontainers.image.revision=$COMMIT_SHA" \\
                                --file Dockerfile \\
                                --tag "${IMAGE_PREFIX}-backend:${IMAGE_TAG}" .
                            docker build --pull \\
                                --label "org.opencontainers.image.revision=$COMMIT_SHA" \\
                                --file Dockerfile.frontend \\
                                --tag "${IMAGE_PREFIX}-frontend:${IMAGE_TAG}" .
                            docker push "${IMAGE_PREFIX}-backend:${IMAGE_TAG}"
                            docker push "${IMAGE_PREFIX}-frontend:${IMAGE_TAG}"
                        '''
                    }
                }
            }
        }

        stage('Deploy and verify') {
            steps {
                dir('smartcare-source') {
                    sh '''
                        bash scripts/deploy-k3s.sh \\
                            "$COMMIT_SHA" \\
                            "$K8S_NAMESPACE" \\
                            "$BACKEND_DEPLOYMENT" \\
                            "$BACKEND_CONTAINER" \\
                            "$BACKEND_SERVICE" \\
                            "$FRONTEND_DEPLOYMENT" \\
                            "$FRONTEND_CONTAINER" \\
                            "$FRONTEND_SERVICE"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "SmartCare commit ${params.COMMIT_SHA} passed CI/SonarCloud and was deployed with smoke tests."
        }
        failure {
            echo "SmartCare deployment failed for ${params.COMMIT_SHA}. The deployment script attempts to restore the previous images."
        }
    }
}
