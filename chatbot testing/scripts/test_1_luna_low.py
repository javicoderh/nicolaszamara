"""Run test 1 independently against the real app pipeline with Luna low."""
from pipeline_common import run_case

if __name__ == '__main__':
    raise SystemExit(run_case(1, 'low'))
