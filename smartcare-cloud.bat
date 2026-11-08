@echo off
setlocal
rem Usage: smartcare-cloud.bat [start|connect|shell|stop] (default: start)
rem SSM starts services and forwards Jenkins to localhost without inbound SSH/Jenkins rules.
if not defined SC_REGION set SC_REGION=ap-south-1
if not defined SC_NAME   set SC_NAME=smartcare-devops-server

set ACTION=%1
if "%ACTION%"=="" set ACTION=start

where aws >nul 2>&1 || (echo AWS CLI not found. Install it and run: aws configure & exit /b 1)
if exist "%ProgramFiles%\Amazon\SessionManagerPlugin\bin\session-manager-plugin.exe" set "PATH=%PATH%;%ProgramFiles%\Amazon\SessionManagerPlugin\bin"

for /f "delims=" %%i in ('aws ec2 describe-instances --region %SC_REGION% --filters "Name=tag:Name,Values=%SC_NAME%" "Name=instance-state-name,Values=pending,running,stopping,stopped" --query "Reservations[0].Instances[0].InstanceId" --output text') do set ID=%%i
if not defined ID (echo Could not query AWS. Check your credentials/region. & exit /b 1)
if "%ID%"=="None" (echo No instance tagged %SC_NAME% in %SC_REGION%. & exit /b 1)

if /i "%ACTION%"=="stop" goto stop
if /i "%ACTION%"=="connect" goto connect
if /i not "%ACTION%"=="start" if /i not "%ACTION%"=="shell" (echo Unknown action: %ACTION% - use start, connect, shell, or stop. & exit /b 1)

for /f "delims=" %%i in ('aws ec2 describe-instances --region %SC_REGION% --instance-ids %ID% --query "Reservations[0].Instances[0].State.Name" --output text') do set INSTANCE_STATE=%%i
if /i "%INSTANCE_STATE%"=="stopped" goto start_ec2
if /i "%INSTANCE_STATE%"=="running" goto wait_ec2
if /i "%INSTANCE_STATE%"=="pending" goto wait_ec2
echo EC2 is %INSTANCE_STATE%. Wait for it to stop or start, then retry.
exit /b 1

:start_ec2
echo Starting EC2 %ID% ... (takes 1-3 minutes)
aws ec2 start-instances --region %SC_REGION% --instance-ids %ID% >nul || exit /b 1

:wait_ec2
aws ec2 wait instance-status-ok --region %SC_REGION% --instance-ids %ID% || exit /b 1

echo Waiting for the SSM agent to come online ...
set /a ATTEMPTS=0
:wait_ssm
set "SSM_STATUS="
for /f "delims=" %%i in ('aws ssm describe-instance-information --region %SC_REGION% --filters "Key=InstanceIds,Values=%ID%" --query "InstanceInformationList[0].PingStatus" --output text 2^>nul') do set SSM_STATUS=%%i
if /i "%SSM_STATUS%"=="Online" if /i "%ACTION%"=="shell" goto open_shell
if /i "%SSM_STATUS%"=="Online" goto start_services
set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ 36 (
  echo SSM did not come online. Apply the Terraform IAM instance profile, verify the SSM agent and outbound HTTPS, then retry.
  exit /b 1
)
timeout /t 10 /nobreak >nul
goto wait_ssm

:start_services
echo Ensuring Docker, K3s, and Jenkins are running through SSM ...
for /f "delims=" %%i in ('aws ssm send-command --region %SC_REGION% --instance-ids %ID% --document-name AWS-RunShellScript --parameters "commands=['sudo systemctl start docker k3s jenkins']" --query "Command.CommandId" --output text') do set COMMAND_ID=%%i
if not defined COMMAND_ID (echo Failed to send the SSM command. Check your AWS SSM permissions and instance status. & exit /b 1)
if "%COMMAND_ID%"=="None" (echo Failed to send the SSM command. Check your AWS SSM permissions and instance status. & exit /b 1)
aws ssm wait command-executed --region %SC_REGION% --command-id %COMMAND_ID% --instance-id %ID%
if errorlevel 1 (
  aws ssm get-command-invocation --region %SC_REGION% --command-id %COMMAND_ID% --instance-id %ID% --query "StandardErrorContent" --output text
  exit /b 1
)
aws ssm get-command-invocation --region %SC_REGION% --command-id %COMMAND_ID% --instance-id %ID% --query "StandardOutputContent" --output text
if errorlevel 1 exit /b 1

echo.
echo Jenkins is available independent of your public IP through an SSM tunnel.
echo Run smartcare-cloud.bat connect, then open http://localhost:8080
echo GitHub Actions starts stopped EC2 instances and triggers Jenkins after CI and SonarCloud pass.
echo The website is served on the EC2 HTTP address.
echo.
echo GitHub Actions, SonarCloud and Gmail SMTP are hosted services: nothing to start.
exit /b 0

:connect
echo Forwarding Jenkins to http://localhost:8080 . Keep this window open.
aws ssm start-session --region %SC_REGION% --target %ID% --document-name AWS-StartPortForwardingSession --parameters "portNumber=8080,localPortNumber=8080"
exit /b %ERRORLEVEL%

:open_shell
echo Opening an interactive EC2 shell through SSM. No SSH port is used.
aws ssm start-session --region %SC_REGION% --target %ID%
exit /b %ERRORLEVEL%

:stop
aws ec2 stop-instances --region %SC_REGION% --instance-ids %ID% --query "StoppingInstances[0].CurrentState.Name" --output text || exit /b 1
exit /b 0
