#!/usr/bin/python

import sys
import argparse
import ast
from astpp import *

desc = 'Create snippets used for code completion.'
parser = argparse.ArgumentParser(description=desc)
pathHelp = 'The path to the OpenMDAO repository.'
parser.add_argument('openmdao_path', type=str, nargs='?', default=None, help=pathHelp)
args = parser.parse_args()

if args.openmdao_path is None:
  parser.print_help()
  sys.exit(1)

class VisitingSnippetWriter(ast.NodeVisitor):
  def __init__(self, file):
    ast.NodeVisitor.__init__(self)
    self.file = file
    file.write('".source.python":\n')

  def visit_FunctionDef(self, node):
    print node.name
    if node.name.find('_', 0, 1) is -1:
      print 'blah'
      self.file.write('  "' + node.name + '":\n')
      self.file.write('    prefix: ' + '"' + node.name[:3] + '"\n')
      args = ', '.join("${%s:%s}" % (k + 1, v.id) for (k, v) in zip(range(len(node.args.args)), node.args.args))
      self.file.write('    body: "' + node.name + '(' + args + ')"\n')
    self.generic_visit(node)

with open(args.openmdao_path + '/openmdao/core/system.py', 'r') as fin:
  code = fin.read()

with open('../snippets/openmdao-snippets.cson', 'w') as fout:
  tree = ast.parse(code)
  VisitingSnippetWriter(fout).visit(tree)
  
