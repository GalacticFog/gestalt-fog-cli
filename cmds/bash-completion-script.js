exports.command = 'bash-completion'
exports.desc = 'Show Bash Completion Script'
exports.builder = {}
exports.handler = function (argv) {

    console.log(`#
# Run: fog bash-completion >> ~/.bashrc
#
_fog_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    # ask yargs to generate completions.
    type_list=$(fog --get-yargs-completions "\${args[@]}")

    COMPREPLY=( $(compgen -W "\${type_list}" -- \${cur_word}) )

    # if no match was found, fall back to filename completion
    if [ \${#COMPREPLY[@]} -eq 0 ]; then
        COMPREPLY=( $(compgen -f -- "\${cur_word}" ) )
    fi

    return 0
}
complete -F _fog_completions fog`);
}