// https://pro.helloimg.com/page/api-docs.html
module.exports = (ctx) => {
  const register = () => {
	  ctx.helper.uploader.register('helloimg-pro', {
      handle,
      config: config,
      name: 'helloimg-pro'
    })
  }
  
  return {
    register,
	uploader: 'helloimg-pro'
  }
}

// for user config
const config = ctx => {
  let userConfig = ctx.getConfig('picBed.helloimg-pro');
  if (!userConfig) {
    userConfig = {};
  }
  return [{
    name: 'token',
    type: 'input',
    default: userConfig.token || '',
    required: true,
    message: '请输入helloimg(pro) token',
    alias: 'token'
  }, {
    name: 'permission',
    type: 'list',
	choices: [0, 1],
    default: userConfig.permission || 0,
    required: true,
    message: '请选择存储权限(1:公开，0:私有)',
    alias: '存储权限(1:公开，0:私有)'
  }];
}

const handle = async (ctx) => {
  let pluginConfig = ctx.getConfig('picBed.helloimg-pro');
  if (!pluginConfig) {
    throw new Error("Load helloimg-pro config failed.");
  }

  const token = pluginConfig.token;
  const permission = pluginConfig.permission;
  // 获取上传列表
  const imgList = ctx.output;
  for (let i in imgList) {
	 let img = imgList[i];
     if (img.fileName && img.buffer) {
			let image = img.buffer;
		    const postConfig = buildUploadPostOptions(ctx,  pluginConfig, image, img.fileName);
			try {
				const res = await ctx.request(postConfig)
				const body = JSON.parse(res)
				if (body.status === true) {
				  delete img.base64Image
				  delete img.buffer
				  img.imgUrl = body.data.links.url
				} else {
				  ctx.emit('notification', {
					title: '上传Hello图床(专业版)出错!',
					body: body.message
				  })
				  throw new Error(body.message)
				}
			  } catch (e) {
				ctx.log.error(e)
				throw e
			  }
	   }
  }
  
  return ctx;
}

// 构建上传图片请求配置
const buildUploadPostOptions = (ctx, pluginConfig, image, imageName) => {
  // helloimg pro地址
  const helloproUrl = 'https://pro.helloimg.com/api/v1';
  return {
    method: 'POST',
    url: helloproUrl + '/upload',
    headers: {
	  'Authorization': 'Bearer ' + pluginConfig.token,
	  'contentType': 'multipart/form-data'
    },
    formData: {
      file: {
		  'value': image,
		  'options': {
			  'filename': imageName
		  }
	  },
	  permission: pluginConfig.permission,
	  strategy_id: 1
    }
  }
}