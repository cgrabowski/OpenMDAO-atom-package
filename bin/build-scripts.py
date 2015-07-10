#!/usr/bin/python

import sys

script_head_pre = '''\
#!/usr/bin/python
#
# AUTOMATICALLY GENERATED SCRIPT! MANUALLY EDITING THIS FILE DOES NOTHING!
#

import argparse
import sys
'''

sys_and_dep_chart_script_head = '''
desc = 'Create a HTML chart representing a system hierarchy and dependency matrix.'
parser = argparse.ArgumentParser(description=desc)
fileHelp = 'The input json file of combined system hierarchy and dependency matrix data.'
parser.add_argument('json_file', type=str, nargs='?', default=None, help=fileHelp)
outHelp = 'The output HTML file. Default is stdout.'
parser.add_argument('-o', '--out', type=str, default=None, metavar='html_out', help=outHelp)
args = parser.parse_args()

if args.json_file is None:
  parser.print_help()
  sys.exit(1)
'''

sys_chart_script_head = '''
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
'''

dep_chart_script_head = '''
desc = 'Create a HTML chart from JSON representing system variable dependencies.'
parser = argparse.ArgumentParser(description=desc)
fileHelp = 'The input json file of dependency data.'
parser.add_argument('json_file', type=str, nargs='?', default=None, help=fileHelp)
outHelp = 'The output HTML file. Default is stdout.'
parser.add_argument('-o', '--out', type=str, default=None, metavar='html_out', help=outHelp)
args = parser.parse_args()

if args.json_file is None:
  parser.print_help()
  sys.exit(1)
'''

script_head_post = '''
# called at the end of the file
def write_and_close(args, head, d3, body, foot):
  with open(args.json_file, 'r') as fin:
    json = fin.read()
  if args.out is None:
    sys.stdout.write(head)
    sys.stdout.write(d3)
    sys.stdout.write(body)
    sys.stdout.write(json)
    sys.stdout.write(foot)
  else:
    with open(args.out, 'w+') as fout:
      fout.write(head)
      fout.write(d3)
      fout.write(body)
      fout.write(json)
      fout.write(foot)

'''

script_tail = '''
write_and_close(args, head, d3, body, foot)

'''

with open('../lib/charting/chart.html', 'r') as fin:
  sys_chart_html_parts = fin.read().partition('</body>')

with open('../vendor/d3.min.js', 'r') as fin:
  d3_min_js = fin.read()

with open('../lib/charting/charting-main.js', 'r') as fin:
  chart_main_js = fin.read()

with open('../lib/charting/sys-hierarchy-chart.js', 'r') as fin:
  sys_chart_js = fin.read()

with open('../lib/charting/dependencies-chart.js', 'r') as fin:
  dep_chart_js = fin.read()

with open('sys-and-dep-chart.py', 'w') as fout:
  fout.write(script_head_pre)
  fout.write(sys_and_dep_chart_script_head)
  fout.write(script_head_post)
  fout.write("head = '''" + sys_chart_html_parts[0] + "\n<!-- d3 library -->\n<script>'''\n\n")
  fout.write("d3 = r'''\n" + d3_min_js + "\n'''\n\n")
  fout.write("body = '''</script>\n")
  fout.write("<script>\n" + sys_chart_js + "\n</script>\n")
  fout.write("<script>\n" + dep_chart_js + "\n</script>\n")
  fout.write("<script>\n" + chart_main_js + "\n</script>\n")
  fout.write("<script>\nvar data = '''\n\n")
  fout.write("foot = '''\n\n</script>\n" + sys_chart_html_parts[1] + "\n")
  fout.write(sys_chart_html_parts[2] + "'''\n")
  fout.write(script_tail)

with open('sys-hierarchy-chart.py', 'w') as fout:
  fout.write(script_head_pre)
  fout.write(sys_chart_script_head)
  fout.write(script_head_post)
  fout.write("head = '''" + sys_chart_html_parts[0] + "\n<!-- d3 library -->\n<script>'''\n\n")
  fout.write("d3 = r'''\n" + d3_min_js + "\n'''\n\n")
  fout.write("body = '''</script>\n")
  fout.write("<script>\n" + sys_chart_js + "\n</script>\n")
  fout.write("<script>\n" + chart_main_js + "\n</script>\n")
  fout.write("<script>\nvar data = '''\n\n")
  fout.write("foot = '''\n\n</script>\n" + sys_chart_html_parts[1] + "\n")
  fout.write(sys_chart_html_parts[2] + "'''\n")
  fout.write(script_tail)

with open('dependencies-chart.py', 'w') as fout:
  fout.write(script_head_pre)
  fout.write(dep_chart_script_head)
  fout.write(script_head_post)
  fout.write("head = '''" + sys_chart_html_parts[0] + "\n<!-- d3 library -->\n<script>'''\n\n")
  fout.write("d3 = r'''\n" + d3_min_js + "\n'''\n\n")
  fout.write("body = '''</script>\n")
  fout.write("<script>\n" + dep_chart_js + "\n</script>\n")
  fout.write("<script>\n" + chart_main_js + "\n</script>\n")
  fout.write("<script>\nvar data = '''\n\n")
  fout.write("foot = '''\n\n</script>\n" + sys_chart_html_parts[1] + "\n")
  fout.write(sys_chart_html_parts[2] + "'''\n")
  fout.write(script_tail)
