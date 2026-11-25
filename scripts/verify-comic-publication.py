"""Compare a deployed comic catalog with the trusted deployment build receipt."""
import argparse
import json
import re


def verify(receipt, live, commit):
    if not re.fullmatch(r'[a-f0-9]{40}', commit):
        raise ValueError('Invalid expected source commit')
    legacy = [('g', 316), ('xiii-r', 49), ('xiv', 133)]
    ids_and_counts = [(book['id'], book['pageCount']) for book in receipt['books']]
    if ids_and_counts not in (legacy, legacy + [('ixiv', 514)]):
        raise ValueError('Unexpected catalog in build receipt')
    if receipt['books'][0]['label'] != 'Full collection':
        raise ValueError('Legacy collection label changed')
    if receipt['imageCount'] != sum(count for _, count in ids_and_counts):
        raise ValueError('Invalid image count in build receipt')
    for field in ('schemaVersion', 'publication', 'imageCount', 'books',
                  'removedAssetCount', 'removedBytes'):
        if live[field] != receipt[field]:
            raise ValueError(f'Live publication differs from build receipt: {field}')
    for catalog in (receipt, live):
        if catalog['sourceCommit'] != commit or catalog['earlierEditionsPublic'] is not False:
            raise ValueError('Publication is stale or exposes retired books')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('receipt', type=argparse.FileType(encoding='utf-8'))
    parser.add_argument('live', type=argparse.FileType(encoding='utf-8'))
    parser.add_argument('commit')
    args = parser.parse_args()
    verify(json.load(args.receipt), json.load(args.live), args.commit)
