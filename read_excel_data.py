
import pandas as pd
import json
import sys

try:
    file_path = 'RTM/Vehicles_RTM_Updated.xlsx'
    # Read all sheets
    xls = pd.ExcelFile(file_path)
    data = {}
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name)
        # Convert NaN to None for valid JSON
        df = df.where(pd.notnull(df), None)
        data[sheet_name] = df.to_dict(orient='records')
    
    print(json.dumps(data, indent=2, default=str))
except Exception as e:
    print(f"Error reading Excel file: {e}")
    sys.exit(1)
