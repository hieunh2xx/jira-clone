# Script tự động cấu hình IIS sau khi publish
# Script này sẽ được chạy tự động sau mỗi lần publish

param(
    [string]$SiteName = "ManagementProject",
    [string]$AppPoolName = "ManagementProject",
    [string]$PublishPath = "C:\inetpub\wwwroot\ManagementProject"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cấu hình IIS tự động sau khi publish" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra quyền Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Cảnh báo: Script cần chạy với quyền Administrator để cấu hình IIS" -ForegroundColor Yellow
    Write-Host "   Một số cấu hình có thể không được áp dụng." -ForegroundColor Yellow
    Write-Host ""
}

# Import WebAdministration module
try {
    Import-Module WebAdministration -ErrorAction Stop
    Write-Host "✅ Đã import WebAdministration module" -ForegroundColor Green
}
catch {
    Write-Host "❌ Không thể import WebAdministration module: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Đảm bảo IIS Management Console đã được cài đặt." -ForegroundColor Yellow
    exit 1
}

# Hàm cấu hình Application Pool
function Configure-AppPool {
    param([string]$PoolName)
    
    Write-Host ""
    Write-Host "📋 Đang cấu hình Application Pool: $PoolName" -ForegroundColor Cyan
    
    # Kiểm tra Application Pool có tồn tại không
    $poolExists = Get-WebAppPoolState -Name $PoolName -ErrorAction SilentlyContinue
    
    if (-not $poolExists) {
        Write-Host "   ⚠️  Application Pool '$PoolName' không tồn tại. Đang tạo mới..." -ForegroundColor Yellow
        New-WebAppPool -Name $PoolName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    try {
        # Cấu hình Start Mode = AlwaysRunning
        Set-ItemProperty -Path "IIS:\AppPools\$PoolName" -Name "startMode" -Value "AlwaysRunning"
        Write-Host "   ✅ Start Mode = AlwaysRunning" -ForegroundColor Green
        
        # Cấu hình Idle Timeout = 0 (vô hiệu hóa)
        Set-ItemProperty -Path "IIS:\AppPools\$PoolName" -Name "processModel.idleTimeout" -Value ([TimeSpan]::FromMinutes(0))
        Write-Host "   ✅ Idle Timeout = 0 (vô hiệu hóa)" -ForegroundColor Green
        
        # Đảm bảo Application Pool đang chạy
        $state = (Get-WebAppPoolState -Name $PoolName).Value
        if ($state -ne "Started") {
            Start-WebAppPool -Name $PoolName
            Write-Host "   ✅ Đã khởi động Application Pool" -ForegroundColor Green
        } else {
            Write-Host "   ✅ Application Pool đang chạy" -ForegroundColor Green
        }
        
        # Cấu hình .NET CLR Version (nếu cần)
        Set-ItemProperty -Path "IIS:\AppPools\$PoolName" -Name "managedRuntimeVersion" -Value "" -ErrorAction SilentlyContinue
        Write-Host "   ✅ Đã cấu hình .NET Runtime" -ForegroundColor Green
        
        return $true
    }
    catch {
        Write-Host "   ❌ Lỗi khi cấu hình Application Pool: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Hàm cấu hình Website
function Configure-Website {
    param(
        [string]$SiteName,
        [string]$AppPoolName,
        [string]$PhysicalPath
    )
    
    Write-Host ""
    Write-Host "📋 Đang cấu hình Website: $SiteName" -ForegroundColor Cyan
    
    # Kiểm tra Website có tồn tại không
    $siteExists = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
    
    if (-not $siteExists) {
        Write-Host "   ⚠️  Website '$SiteName' không tồn tại." -ForegroundColor Yellow
        Write-Host "   💡 Bạn cần tạo website thủ công trong IIS Manager hoặc sử dụng lệnh:" -ForegroundColor Yellow
        Write-Host "      New-Website -Name '$SiteName' -PhysicalPath '$PhysicalPath' -ApplicationPool '$AppPoolName'" -ForegroundColor Gray
        return $false
    }
    
    try {
        # Đảm bảo Physical Path đúng
        if (Test-Path $PhysicalPath) {
            Set-ItemProperty -Path "IIS:\Sites\$SiteName" -Name "physicalPath" -Value $PhysicalPath
            Write-Host "   ✅ Physical Path = $PhysicalPath" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Physical Path không tồn tại: $PhysicalPath" -ForegroundColor Yellow
        }
        
        # Đảm bảo Application Pool được gán đúng
        Set-ItemProperty -Path "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $AppPoolName
        Write-Host "   ✅ Application Pool = $AppPoolName" -ForegroundColor Green
        
        # Đảm bảo Website đang chạy
        $state = (Get-WebsiteState -Name $SiteName).Value
        if ($state -ne "Started") {
            Start-Website -Name $SiteName
            Write-Host "   ✅ Đã khởi động Website" -ForegroundColor Green
        } else {
            Write-Host "   ✅ Website đang chạy" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Host "   ❌ Lỗi khi cấu hình Website: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Hàm cập nhật web.config
function Update-WebConfig {
    param([string]$ConfigPath)
    
    Write-Host ""
    Write-Host "📋 Đang kiểm tra web.config" -ForegroundColor Cyan
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "   ⚠️  File web.config không tồn tại: $ConfigPath" -ForegroundColor Yellow
        return $false
    }
    
    try {
        [xml]$webConfig = Get-Content $ConfigPath
        
        # Kiểm tra và thêm applicationInitialization nếu chưa có
        $systemWebServer = $webConfig.configuration.'system.webServer'
        if ($null -eq $systemWebServer.applicationInitialization) {
            $appInit = $webConfig.CreateElement("applicationInitialization")
            $appInit.SetAttribute("doAppInitAfterRestart", "true")
            
            $initPage = $webConfig.CreateElement("add")
            $initPage.SetAttribute("initializationPage", "/api/health")
            $appInit.AppendChild($initPage) | Out-Null
            
            $systemWebServer.AppendChild($appInit) | Out-Null
            $webConfig.Save($ConfigPath)
            Write-Host "   ✅ Đã thêm applicationInitialization vào web.config" -ForegroundColor Green
        } else {
            Write-Host "   ✅ web.config đã có applicationInitialization" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Host "   ⚠️  Không thể cập nhật web.config: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   💡 Bạn có thể cập nhật thủ công nếu cần." -ForegroundColor Yellow
        return $false
    }
}

# Thực hiện cấu hình
Write-Host "Thông tin cấu hình:" -ForegroundColor Cyan
Write-Host "  - Site Name: $SiteName" -ForegroundColor Gray
Write-Host "  - App Pool Name: $AppPoolName" -ForegroundColor Gray
Write-Host "  - Publish Path: $PublishPath" -ForegroundColor Gray
Write-Host ""

# Cấu hình Application Pool
$poolConfigured = Configure-AppPool -PoolName $AppPoolName

# Cấu hình Website
$siteConfigured = Configure-Website -SiteName $SiteName -AppPoolName $AppPoolName -PhysicalPath $PublishPath

# Cập nhật web.config
$webConfigPath = Join-Path $PublishPath "web.config"
$configUpdated = Update-WebConfig -ConfigPath $webConfigPath

# Tóm tắt
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tóm tắt cấu hình" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Application Pool: $(if ($poolConfigured) { '✅ Đã cấu hình' } else { '❌ Lỗi' })" -ForegroundColor $(if ($poolConfigured) { 'Green' } else { 'Red' })
Write-Host "Website: $(if ($siteConfigured) { '✅ Đã cấu hình' } else { '⚠️  Cần kiểm tra' })" -ForegroundColor $(if ($siteConfigured) { 'Green' } else { 'Yellow' })
Write-Host "Web.config: $(if ($configUpdated) { '✅ Đã cập nhật' } else { '⚠️  Cần kiểm tra' })" -ForegroundColor $(if ($configUpdated) { 'Green' } else { 'Yellow' })
Write-Host ""

if ($poolConfigured) {
    Write-Host "✅ Background Service sẽ tự động chạy và gửi email hàng ngày!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Vui lòng kiểm tra lại cấu hình Application Pool." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Hoàn tất!" -ForegroundColor Cyan
