"""Run test 2 independently against the real app pipeline with Luna high."""
from pipeline_common import run_case
import sys

if __name__ == '__main__':
    if '--resume' in sys.argv:
        from resume_high import resume_high
        raise SystemExit(resume_high())
    raise SystemExit(run_case(2, 'high'))
