import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('catalog', Path(__file__).resolve().parents[1] / 'scripts/verify-comic-publication.py')
catalog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalog)


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.commit = 'a' * 40
        self.receipt = dict(schemaVersion=1, publication='fixture', sourceCommit=self.commit,
                            earlierEditionsPublic=False, imageCount=498,
                            removedAssetCount=0, removedBytes=0,
                            books=[dict(id=i, pageCount=n, label=l) for i, n, l in
                                   [('g', 316, 'Full collection'), ('xiii-r', 49, 'XIII'), ('xiv', 133, 'XIV')]])

    def add_collection(self):
        self.receipt['books'].append(dict(id='ixiv', pageCount=514, label='I–XIV', pdfSha256='b' * 64))
        self.receipt['imageCount'] = 1012

    def test_legacy_exact(self):
        catalog.verify(self.receipt, copy.deepcopy(self.receipt), self.commit)

    def test_new_catalog_exact(self):
        self.add_collection()
        catalog.verify(self.receipt, copy.deepcopy(self.receipt), self.commit)

    def test_rejects_wrong_pdf_identity(self):
        self.add_collection()
        live = copy.deepcopy(self.receipt)
        live['books'][-1]['pdfSha256'] = 'c' * 64
        with self.assertRaisesRegex(ValueError, 'books'):
            catalog.verify(self.receipt, live, self.commit)

    def test_rejects_wrong_commit_even_if_payloads_agree(self):
        with self.assertRaisesRegex(ValueError, 'stale'):
            catalog.verify(self.receipt, self.receipt, 'b' * 40)

    def test_rejects_expanded_edition(self):
        self.add_collection()
        self.receipt['books'][-1]['pageCount'] = 515
        self.receipt['imageCount'] = 1013
        with self.assertRaisesRegex(ValueError, 'Unexpected catalog'):
            catalog.verify(self.receipt, self.receipt, self.commit)
