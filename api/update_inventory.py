import pandas as pd
import sys

def update_inventory(base_path, changes_path, operation='subtract'):
    
    base = pd.read_csv(base_path)
    changes = pd.read_csv(changes_path)

    merge_how = 'outer' if operation == 'add' else 'left'
    on_cols = ['product', 'category']

    merged = base.merge(changes, 
                        on=on_cols,
                        how=merge_how,
                        suffixes=('', '_change'))

    for col in ['Inventory Count', 'Inventory Count_change']:
        merged[col] = merged[col].fillna(0)

    if operation == 'subtract':
        merged['Updated Inventory'] = merged['Inventory Count'] - merged['Inventory Count_change']
        merged['Updated Inventory'] = merged['Updated Inventory'].clip(lower=0)
    else:
        merged['Updated Inventory'] = merged['Inventory Count'] + merged['Inventory Count_change']

    result = merged[on_cols + ['Updated Inventory']].rename(
        columns={'Updated Inventory': 'Inventory Count'}
    )
    result.to_csv('updated_inventory.csv', index=False)

if __name__ == '__main__':
    base_file = sys.argv[1]
    changes_file = sys.argv[2]
    operation = sys.argv[3] if len(sys.argv) > 3 else 'subtract'
    print(f"Base file path: {base_file}")
    print(f"Changes file path: {changes_file}")
    update_inventory(base_file, changes_file, operation)
    
