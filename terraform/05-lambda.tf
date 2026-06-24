module "docker_image" {
  source = "terraform-aws-modules/lambda/aws//modules/docker-build"

  create_ecr_repo = true
  ecr_repo        = "${var.project_prefix}-repo"
  use_image_tag   = false

  triggers = {
    redeployment = timestamp()
  }

  source_path = "../"
}

module "lambda_function" {
  source = "terraform-aws-modules/lambda/aws"

  function_name  = "${var.project_prefix}-function"
  create_package = false
  image_uri      = module.docker_image.image_uri
  package_type   = "Image"
  timeout        = 300
  memory_size    = 256

  create_role = false
  lambda_role = aws_iam_role.lambda_role.arn

  environment_variables = {
    DATABASE_URL      = var.database_url
    CONCURRENCY_LIMIT = 10
    CHUNK_DELAY_MS    = 50
    LAMBDA_TIMEOUT_MS = 290000
  }
}