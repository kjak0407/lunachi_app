"""Pack complete objects, rather than cutting objects at imperfect grid edges."""
from pathlib import Path
import runpy
import sys

root=Path(__file__).resolve().parents[1]
source=root/'.tools/new-play-source.png'
source.parent.mkdir(exist_ok=True)
source.write_bytes(Path(sys.argv[1]).read_bytes())
sys.argv=['prepare-new-atlases.py','new-play']
runpy.run_path(str(root/'scripts/prepare-new-atlases.py'),run_name='__main__')
