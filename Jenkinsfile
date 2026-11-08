pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Lint and Build') {
            steps {
                sh 'npm ci'
                sh 'npm run lint'
                sh 'npm run build'
            }
        }

        stage('SonarCloud Quality Gate') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SmartCare-SonarCloud') {
                        sh "${scannerHome}/bin/sonar-scanner -Dsonar.qualitygate.wait=true -Dsonar.qualitygate.timeout=300"
                    }
                }
            }
        }
    }
}
