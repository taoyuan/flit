# Completion for flit
> Thanks to grunt team and Tyler Kellen

To enable tasks auto-completion in shell you should add `eval "$(flit --completion=shell)"` in your `.shellrc` file.

## Bash

Add `eval "$(flit --completion=bash)"` to `~/.bashrc`.

## Zsh

Add `eval "$(flit --completion=zsh)"` to `~/.zshrc`.

## Powershell

Add `Invoke-Expression ((flit --completion=powershell) -join [System.Environment]::NewLine)` to `$PROFILE`.
