$source = "h:\InnovativeSolutions\GraceERPSystem\client\src\Adminitrator\Dashboards\Admin\Modules\FeesAndFinance\components"
$target = "h:\InnovativeSolutions\GraceERPSystem\client\src\Adminitrator\Dashboards\Account\Modules\components"

# Delete existing files in target
Remove-Item -Path "$target\*" -Recurse -Force -ErrorAction SilentlyContinue

# Copy all files from source to target
Copy-Item -Path "$source\*" -Destination $target -Recurse -Force

# Process each file in the target directory
Get-ChildItem -Path $target -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw

    # First, replace the 6-level up imports with a placeholder
    $content = $content -replace "\.\./\.\./\.\./\.\./\.\./\.\./", "##SIX##"

    # Then, replace the 5-level up imports with a placeholder
    $content = $content -replace "\.\./\.\./\.\./\.\./\.\./", "##FIVE##"
    
    # Finally, replace the placeholders with one level less
    $content = $content -replace "##SIX##", "../../../../../"
    $content = $content -replace "##FIVE##", "../../../../"

    Set-Content -Path $_.FullName -Value $content -NoNewline
}
Write-Output "Copy and import update complete."
