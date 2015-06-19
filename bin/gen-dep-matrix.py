#!/usr/bin/python

import argparse
import sys
import json
import pprint
from collections import OrderedDict

desc = 'Create a dependency matrix in JSON format.'
parser = argparse.ArgumentParser(description=desc)
file_help = 'The input JSON file of system hierarchy data.'
parser.add_argument('input_file', type=str, nargs='?', default=None, help=file_help)
matrix_help = 'The multidimensional list of dependencies.'
parser.add_argument('dep_matrix', type=list, nargs='?', default=None, help=matrix_help)
out_help = 'The output dependency matrix JSON file.'
parser.add_argument(
    '-o', '--out', type=str, default=None, metavar="json_out", help=out_help)
args = parser.parse_args()

if args.input_file is None:
  parser.print_help()
  sys.exit(1)

pp = pprint.PrettyPrinter()

with open(args.input_file, 'r') as fin:
  json_dict = json.load(fin, object_pairs_hook=OrderedDict)

def find_deepest_dictionary_nodes(key_in, tree_in, list_out):
  has_child_dictionaries = False
  for key, value in tree_in.iteritems():
    if type(value) is OrderedDict:
      has_child_dictionaries = True
      list_out = find_deepest_dictionary_nodes(key, value, list_out)

  if has_child_dictionaries is False:
    list_out.append(key_in)

  return list_out

def gen_id_matrix(n):
  out = []
  for i in range(0, n):
    out.append([])
    for j in range(0, n):
      out[i].append(1 if i == j else 0)
  return out

leaves = []
find_deepest_dictionary_nodes('root', json_dict, leaves)
#pp.pprint(leaves)

#if args.dep_matrix is None:
mat = gen_id_matrix(len(leaves))
#pp.pprint(mat)

output = {"labels": leaves, "depMatrix": mat}

if args.out is None:
  sys.stdout.write(json.dumps(output) + '\n\n')
else:
  with open(args.out, 'w') as fout:
    fout.write(json.dumps(output) + '\n')
