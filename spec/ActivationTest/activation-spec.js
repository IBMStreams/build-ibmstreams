'use babel';

// import { expect } from 'chai';
// import * as atom from "atom";


describe('Activate IBM Streams Extension', () => {
  describe('build-ibmstreams activation', async () => {
    let mainModule;
    beforeEach(async () => {
      const { mainModule } = await atom.packages.activatePackage('build-ibmstreams');
    });
    it('tests if the package active', async () => {
      expect(mainModule).not.toBeNull();
      expect(atom.packages.isPackageActive('build-ibmstreams')).toEqual(true);
    });
  });

  describe('build-ibmstreams deactivation', async () => {
    beforeEach(async () => {
      await atom.packages.deactivatePackage('build-ibmstreams');
    });

    it('deactivates package', () => {
      expect(atom.packages.isPackageActive('build-ibmstreams')).toEqual(false);
    });
  });
});
