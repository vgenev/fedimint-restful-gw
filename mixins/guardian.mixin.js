const { MoleculerError } = require("moleculer").Errors;
const shellCommandExecutor = require("../mixins/shell_command_executor.mixin");

module.exports = {

	async checkDaemonStarted(federationId, node) {
		const params = [federationId, node];
		const args = ["--federation-id", "--node"];

		const cmd = "./bootstrap-scripts/check_daemon_started.sh";
		const result = await shellCommandExecutor.executeCommand(cmd, args, params);
		return result;
	},

	async createGuardianCertificate(config) {
		const params = [config.federationId, config.node, config.basePort, config.name, config.secret];
		const args = ["--federation-id", "--node", "--federation-base-port", "--name", "--secret"];

		const cmd = "./bootstrap-scripts/create_guardian_cert.sh";
		const result = await shellCommandExecutor.executeCommand(cmd, args, params);
		if (result.error === null) {
			console.log(`Created config directory for guardian with node id: ${config.node}, federation id: ${config.federationId}`);
			console.log(result.output);
		} else {
			console.error(result.error);
			console.error(`Couldn't create config directory for guardian with id: ${config._id}, reason: ${result.errorMessage}`);
			throw new MoleculerError("Something went wrong", 500, "Internal Server Error");
		}
		return result;
	},

	async exchangeCertificate(config) {
		const params = [config.federationId, config.federationName, config.node, config.secret];
		const args = ["--federation-id", "--federation-name", "--node", "--secret"];

		const cmd = "./bootstrap-scripts/exchange_keys.sh";
		const result = await shellCommandExecutor.executeCommand(cmd, args, params);
		if (result.error === null) {
			console.log(`Initiated key exchange for guardian with id: ${config.node}`);
			console.log(result.output);
		} else {
			console.error(result.error);
			console.error(`Failed to exchange keys for guardian with id: ${config.node}, reason: ${result.errorMessage}`);
			throw new MoleculerError("Something went wrong", 500, "Internal Server Error");
		}
		return result;
	},

	async startDaemon(config) {
		const params = [config.federationId, config.node, config.secret];
		const args = ["--federation-id", "--node", "--secret"];

		const cmd = "./bootstrap-scripts/start_federation_guardian_daemon.sh";
		await shellCommandExecutor.executeCommand(cmd, args, params);
		const check = await this.checkDaemonStarted(config.federationId, config.node);
		if (check.error === null) {
			console.log(`Starting guardian daemon with node id: ${config.node}, federation id ${config.federationId}`);
			console.log(check.output);
		} else {
			console.error(check.error);
			console.error(`Failed to start guardian daemon with node id: ${config.node}, federation id: ${config.federationId}, reason: ${check.errorMessage}`);
			throw new MoleculerError("Something went wrong", 500, "Internal Server Error");
		}
		return check;
	}
};
