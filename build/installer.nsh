; Custom NSIS installer script for FileKeeper
; Runs at installer init — kills any running instance before files are replaced

!macro customInit
  ; Silently kill any running FileKeeper process so the installer
  ; can overwrite the files without "file in use" errors
  nsExec::ExecToLog 'taskkill /F /IM "FileKeeper.exe"'
  ; Small pause to let the process fully exit before NSIS proceeds
  Sleep 1500
!macroend
