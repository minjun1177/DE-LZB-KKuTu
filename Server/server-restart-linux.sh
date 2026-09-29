#!/usr/bin/env bash
# Rule the words! DE LZB KKuTu
# You can see this file in <https://github.com/minjun1177/DE-LZB-KKuTu>
# (shebang must be the first line or it is ignored)
set -euo pipefail

PIDS=$(pgrep -f "node lib/(Game|Web)/cluster\.js" || true)

# Nothing running is fine for a restart: just start the servers below.
if [ -z "${PIDS}" ]; then
  echo "No running KKuTu cluster process found."
else
  echo "Stopping KKuTu cluster processes: ${PIDS}"
  kill ${PIDS} || true

  sleep 1
  REMAINING=$(pgrep -f "node lib/(Game|Web)/cluster\.js" || true)

  if [ -n "${REMAINING}" ]; then
    echo "Force stopping remaining processes: ${REMAINING}"
    kill -9 ${REMAINING} || true
  fi

  echo "KKuTu server stopped."
fi


export KKT_SV_NAME='DE LZB KKuTu'
KKT_SV_NUMS=2
echo "KKT_SV_NAME=${KKT_SV_NAME}, KKT_SV_NUMS=${KKT_SV_NUMS}"
for ((i=0; i<${KKT_SV_NUMS}; i++)); do
	sh -c "nohup node lib/Game/cluster.js ${i} 1 > game${i}.log 2>&1 &" && sleep 1
	echo "Started game cluster ${i}"
done
sh -c 'nohup node lib/Web/cluster.js 1 > web.log 2>&1 &'
echo "Started web cluster"