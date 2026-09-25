// license.js - activation gate (placeholder implementation)
const LicenseGate = {
  async isActivated() {
    return true;
  },

  async requireActivation() {
    const ok = await this.isActivated();
    if (!ok) {
      throw new Error("LICENSE_REQUIRED");
    }
    return true;
  },
};
