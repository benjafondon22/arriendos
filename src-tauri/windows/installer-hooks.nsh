; Always create a desktop shortcut, including silent installations.
; Application data lives in AppConfig, outside $INSTDIR. Never remove it here.
!macro NSIS_HOOK_POSTINSTALL
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
!macroend
