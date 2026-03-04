#!/usr/bin/env node

/**
 * 自动版本管理和发布脚本
 * 用法：node scripts/release.js [major|minor|patch|version]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取版本参数
const versionArg = process.argv[2];

// 读取当前 package.json
const packagePath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = pkg.version;

console.log(`📦 当前版本：${currentVersion}`);

// 计算新版本
let newVersion;
if (!versionArg || ['major', 'minor', 'patch'].includes(versionArg)) {
	const [major, minor, patch] = currentVersion.split('.').map(Number);

	switch (versionArg) {
		case 'major':
			newVersion = `${major + 1}.0.0`;
			break;
		case 'minor':
			newVersion = `${major}.${minor + 1}.0`;
			break;
		case 'patch':
		default:
			newVersion = `${major}.${minor}.${patch + 1}`;
	}
} else {
	newVersion = versionArg.startsWith('v') ? versionArg.slice(1) : versionArg;
}

console.log(`🚀 新版本：${newVersion}`);

// 更新 package.json
pkg.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, '\t') + '\n');

// Git 操作
try {
	console.log('📝 提交更改...');
	execSync('git add package.json', { stdio: 'inherit' });
	execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'inherit' });

	console.log('🏷️  创建 Tag...');
	execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

	console.log('📤 推送到 GitHub...');
	execSync('git push origin main', { stdio: 'inherit' });
	execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });

	console.log('\n✅ 发布成功！');
	console.log(`📦 npm 包：https://www.npmjs.com/package/${pkg.name}`);
	console.log(
		`🏷️  Release: https://github.com/MY-Final/n8n-nodes-onebot-api/releases/tag/v${newVersion}`,
	);
	console.log('\n⏳ GitHub Actions 正在构建和发布到 npm...');
} catch (error) {
	console.error('❌ 发布失败:', error.message);
	process.exit(1);
}
