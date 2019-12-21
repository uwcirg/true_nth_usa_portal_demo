#!/bin/sh -e

cmdname="$(basename "$0")"
bin_path="$(cd "$(dirname "$0")" && pwd)"
repo_path="${bin_path}/.."


usage() {
    cat << USAGE >&2
Usage:
    $cmdname [-h] [-b] [-n]
    -h     Show this help message
    -b     Backup current database before attempting update
    -n     Do not pull docker images prior to starting

    Docker deployment script
    Pull the latest docker image and recreate relevant containers

USAGE
    exit 1
}

while getopts "bhnf" option; do
    case "${option}" in
        b)
            BACKUP=true
            ;;
        h)
            usage
            ;;
        n)
            NO_PULL=true
            ;;
        f)
            FORCE=true
            ;;
        *)
            usage
            ;;
    esac
done
shift $((OPTIND-1))


if [ -n "$BACKUP" ]; then
    default_backups_dir=/var/opt/portal
    # write backups to system-wide location, if able
    if [ -w "$default_backups_dir" ]; then
        "${bin_path}"/backup-docker.sh -b "$default_backups_dir"
    else
        "${bin_path}"/backup-docker.sh
    fi
fi


# docker-compose commands must be run in the same directory as docker-compose.yaml
docker_compose_directory="${repo_path}/docker"
cd "${docker_compose_directory}"

if [ -z "$NO_PULL" ]; then
    echo "Updating images..."
    docker-compose pull
fi

if [ "$FORCE" != true ]; then
    # how long a system must be inactive before deploying
    # 15 minutes
    min_inactivity_secs=$((15 * 60))
    echo "Checking for activity..."
    inactive_seconds="$(docker-compose exec --env LOG_LEVEL=info web flask last-usage | tr -d '[[:space:]]')"
    if [ $inactive_seconds -lt $min_inactivity_secs ]; then
        echo "System activity detected $inactive_seconds seconds ago; aborting deployment"
        exit 1
    fi
fi


echo "Starting containers..."
# Capture stderr to check for restarted containers
# shell idiom: stderr and stdout file descriptors are swapped and stderr `tee`d
# allows output to terminal and saving to local variable
restarted_containers="$(docker-compose up --detach web 3>&2 2>&1 1>&3 3>&- | tee /dev/stderr)"
