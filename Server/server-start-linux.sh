#!/usr/bin/env bash
# Rule the words! DE LZB KKuTu
# You can see this file in <https://github.com/minjun1177/DE-LZB-KKuTu>
# (shebang must be the first line or it is ignored)
export KKT_SV_NAME='DE LZB KKuTu'
KKT_SV_NUMS=2
echo "KKT_SV_NAME=${KKT_SV_NAME}, KKT_SV_NUMS=${KKT_SV_NUMS}"
for ((i=0; i<${KKT_SV_NUMS}; i++)); do
	sh -c "nohup node lib/Game/cluster.js ${i} 1 > game${i}.log 2>&1 &" && sleep 1
	echo "Started game cluster ${i}"
done
sh -c 'nohup node lib/Web/cluster.js 1 > web.log 2>&1 &'
echo "Started web cluster"