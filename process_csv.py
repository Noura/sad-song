#!/usr/bin/env python
import csv
import json

infile = 'test2.csv'
outfile = 'data.json' 

data = []
with open(infile, 'r') as f:
    reader = csv.reader(f, delimiter=',')
    for row in reader:
        t = row[0][1:].split(':')
        seconds = float(t[0])*60 + float(t[1])
        gsr = float(row[1])
        d = {'seconds': seconds, 'gsr': gsr}
        data.append(d)

with open(outfile, 'w') as f:
    f.write(json.dumps(data, indent=4))
