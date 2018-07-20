#!/usr/bin/env python
import fileinput
import sys
from subprocess import call


def replaceIPsInScenarioFile(scenarioFile, IPs):
    pathToScenario = 'scenarios/utility_scenarios/' + scenarioFile
    strCORNETIP = 'server_ip = '
    changed = 0
    foundNode = False
    for i in range(len(IPs)):
        node = 'node' + str(i + 1)
        for line in fileinput.input(pathToScenario, inplace=True):
            if line.startswith(node):
                foundNode = True
            if strCORNETIP in line and foundNode == True:
                replacedText = '    ' + strCORNETIP + '"' + IPs[i] + '";'
                print replacedText
                foundNode = False
                changed = changed + 1
            else:
                print line,
    print 'changed', changed, 'lines'


def rewriteMasterScenarioFile(scenarioFile):
    f = open("cornet_master_scenario_file.cfg", 'w')
    line = 'scenario_1 = "/utility_scenarios/' + scenarioFile[:-4] + '";\n'
    f.write('num_scenarios = 1;\n')
    f.write('reps_all_scenarios = 1;\n')
    f.write(line)
    f.write('reps_scenario_1 = 1;')
    f.close()


i = 2
ips = []
while i < len(sys.argv):
    ips.append(sys.argv[i])
    i = i + 1
replaceIPsInScenarioFile(sys.argv[1], ips)
rewriteMasterScenarioFile(sys.argv[1])
call(["./crts_controller", "-f", "cornet_master_scenario_file"])
