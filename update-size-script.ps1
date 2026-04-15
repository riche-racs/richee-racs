$files = @("grey-crewneck.html","blue-crewneck.html","red-crewneck.html")
$replacement = '</footer>`r`n    <script>`r`n        document.addEventListener(''DOMContentLoaded'', function () {`r`n            const sizeButtons = document.querySelectorAll(''.size-options button'');`r`n            sizeButtons.forEach(button => {`r`n                button.addEventListener(''click'', () => {`r`n                    if (button.dataset.soldout === ''true'') {`r`n                        button.classList.add(''attempted'');`r`n                        setTimeout(() => button.classList.remove(''attempted''), 250);`r`n                        return;`r`n                    }`r`n                    sizeButtons.forEach(btn => btn.classList.remove(''active''));`r`n                    button.classList.add(''active'');`r`n                });`r`n            });`r`n        });`r`n    </script>'
foreach ($f in $files) {
    $t = Get-Content $f -Raw
    if ($t.Contains('</footer>')) {
        $t = $t.Replace('</footer>', $replacement)
        Set-Content $f -Value $t -Encoding utf8
        Write-Output "Updated $f"
    } else {
        Write-Output "No footer in $f"
    }
}
