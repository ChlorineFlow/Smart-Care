pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'npm run build'
            }
        }

        
// stage('SonarQube Cloud Analysis') {
//     steps {
//         script {
//             def scannerHome = tool 'SonarScanner'

//             withSonarQubeEnv('SmartCare-SonarCloud') {
//                 sh "${scannerHome}/bin/sonar-scanner"
//             }
//         }
//     }
// }

    }

    post {
    success {
        echo 'SmartCare CI build completed successfully.'
    }
    failure {
        echo 'SmartCare CI build failed.'
    }
}
}