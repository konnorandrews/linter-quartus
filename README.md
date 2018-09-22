# linter-quartus
This package is a linter provider for Quartus.

ModelSim's analyzer is used on file changes instead of Quartus' because Quartus' analyzer can take a few minutes to fully build the project.

### Current Package Status
| Feature | Status | Details |
|-|-|-|
| | | |
| Quartus analyze on file save | Not Implemented |  |
| | | |
| ModelSim fast analyze on file change | Working |  |
| ModelSim analyze on file save | Working |  |
| ModelSim VHDL custom package support | Working | Uses a shared work directory for all files in the same project folder |
