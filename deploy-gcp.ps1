# CricketMind AI - GCP Deployment Script
$PROJECT_ID = "shabaaz-ai"
$REGION = "us-central1"
$SERVICE_NAME = "cricketmind-ai"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "Starting deployment to GCP..."

# 1. Build
Write-Host "Building container..."
gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}

# 2. Env Vars
$ENV_VARS = @("NODE_ENV=production")
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    foreach ($line in $envContent) {
        $line = $line.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim("'").Trim('"')
            if ($key -and $val) {
                $ENV_VARS += "$key=$val"
            }
        }
    }
}
$ENV_VARS_STR = [string]::Join(",", $ENV_VARS)

# 3. Deploy
Write-Host "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --project $PROJECT_ID `
    --set-env-vars $ENV_VARS_STR

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment complete!"
} else {
    Write-Error "Deployment failed"
    exit 1
}
