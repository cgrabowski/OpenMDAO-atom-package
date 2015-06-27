#!/usr/bin/python

import sys
import argparse
import ast
import os

ignored_dirs = [
  'test',
  'config',
  'docs',
  'units'
]

ignored_files = ['__init__.py']

desc = 'Create snippets used for code completion.'
parser = argparse.ArgumentParser(description=desc)
pathHelp = 'The path to the OpenMDAO repository.'
parser.add_argument('openmdao_path', type=str, nargs='?', default=None, help=pathHelp)
outHelp = 'The path to the output file.'
parser.add_argument('output_file_path', type=str, nargs='?', default=None, help=outHelp)
args = parser.parse_args()

if args.openmdao_path is None:
  parser.print_help()
  sys.exit(1)

class VisitingSnippetWriter(ast.NodeVisitor):
  def __init__(self, file):
    ast.NodeVisitor.__init__(self)
    self.file = file

  def visit_ClassDef(self, node):
      comp = [n for n in node.body if hasattr(n, 'name') and n.name == '__init__']
      if len(comp) > 0:
        ctor = comp[0]
        self.file.write('  "' + node.name + '":\n')
        self.file.write('    prefix: ' + '"' + node.name + '"\n')
        nargs = ctor.args.args
        args = ', '.join("${%s:%s}" % (k + 1, v.id) for (k, v) in zip(range(len(nargs)), nargs))
        self.file.write('    body: "' + node.name + '(' + args + ')"\n')
      self.generic_visit(node)

  def visit_FunctionDef(self, node):
    if node.name.find('_', 0, 1) is -1:
      self.file.write('  "' + node.name + '":\n')
      self.file.write('    prefix: ' + '"' + node.name + '"\n')
      nargs = node.args.args
      args = ', '.join("${%s:%s}" % (k + 1, v.id) for (k, v) in zip(range(len(nargs)), nargs))
      self.file.write('    body: "' + node.name + '(' + args + ')"\n')
    self.generic_visit(node)

with open(args.output_file_path, 'w') as fout:
  fout.write('".source.python":\n')
  for root, dirs, files in os.walk(os.path.join(args.openmdao_path, 'openmdao')):
    if not set(root.split('/')).intersection(ignored_dirs):
      for file in files:
        if file not in ignored_files:
          try:
            with open(os.path.join(root, file), 'r') as fin:
              try:
                code = fin.read()
              except:
                print "error reading file " + fin.name + ': ' + str(sys.exc_info()) + '\n'
              try:
                tree = ast.parse(code)
              except:
                print "error parsing source in " + fin.name + ': ' + str(sys.exc_info()) + '\n'
              VisitingSnippetWriter(fout).visit(tree)
          except:
              print "error opening file " + fin.name + ': ' + str(sys.exc_info()) + '\n'

print 'OpenMDAO auto-complete snippet generation complete.'
