#!/usr/bin/python
#
# Currently this script only generates sys-hierarchy-chart.py
#

import sys

sys_chart_script_head = '''\
#!/usr/bin/python
#
# AUTOMATCALLY GENERATED SCRIPT! MANUALLY EDITING THIS FILE DOES NOTHING!
#

import argparse
import sys

desc = 'Create a HTML partition chart from JSON representing a system hierarchy.'
parser = argparse.ArgumentParser(description=desc)
fileHelp = 'The input json file of system hierarchy data.'
parser.add_argument('json_file', type=str, nargs='?', default=None, help=fileHelp)
outHelp = 'The output HTML file. Default is stdout.'
parser.add_argument('-o', '--out', type=str, default=None, metavar='html_out', help=outHelp)
args = parser.parse_args()

if args.json_file is None:
    parser.print_help()
    sys.exit(1)

# called at the end of the file
def write_and_close(args, head, d3, body, foot):
  with open(args.json_file, 'r') as fin:
    json = fin.read()
  if args.out is None:
    sys.stdout.write(head + d3 + body + json + foot)
  else:
    with open(args.out, 'w') as fout:
      fout.write(head + d3 + body + json + foot)

'''

sys_chart_script_tail = '''
write_and_close(args, head, d3, body, foot)\n
'''

with open('sys-hierarchy-chart.py', 'w') as fout:

  with open('../views/sys-hierarchy-chart.html', 'r') as fin:
    sys_chart_html_parts = fin.read().partition('</body>')

  with open('../vendor/d3.min.js', 'r') as fin:
    d3_min_js = fin.read()

  with open('../lib/sys-hierarchy-chart.js', 'r') as fin:
    sys_chart_js = fin.read()

  fout.write(sys_chart_script_head)
  fout.write("head = '''" + sys_chart_html_parts[0] + "\n<!-- d3 library -->\n<script>'''\n\n")
  fout.write("d3 = r'''\n" + d3_min_js + "\n'''\n\n")
  fout.write("body = '''</script>\n<script>\n" + sys_chart_js + "\n</script>\n")
  fout.write("<script>\nvar data = { 'root':\n'''\n\n")
  fout.write("foot = '''\n};\n</script>\n" + sys_chart_html_parts[1] + "\n")
  fout.write(sys_chart_html_parts[2] + "'''\n")
  fout.write(sys_chart_script_tail)
