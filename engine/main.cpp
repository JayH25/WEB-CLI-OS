#include <iostream>
#include <vector>
using namespace std;

vector<string> virtualFiles;

int main() {
    string command, argument;

    while (true) {
        cin >> command;

        if (command == "exit") {
            break;
        }

        if (command == "mkdir") {
            cin >> argument;
            virtualFiles.push_back(argument);
            cout << "Created folder: " << argument << endl;
        }
        else if (command == "ls") {
            if (virtualFiles.size() == 0) {
                cout << "Directory is empty." << endl;
            } else {
                for (int i = 0; i < virtualFiles.size(); i++) {
                    cout << virtualFiles[i] << " ";
                }
                cout << endl;
            }
        }
        else {
            cout << "Command not recognized: " << command << endl;
        }

        cout << "===END_OF_COMMAND===" << endl;
    }

    return 0;
}