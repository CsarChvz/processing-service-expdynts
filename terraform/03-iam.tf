


# Rol para la Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.service_prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Crear política para CloudWatch Logs
resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "${var.service_prefix}-cloudwatch-policy"
  description = "Permite escribir logs en CloudWatch"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Adjuntar la política de logs al rol
resource "aws_iam_role_policy_attachment" "cloudwatch_logs_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
}

# Rol para el Pipe
resource "aws_iam_role" "pipe_role" {
  name = "${var.service_prefix}-pipe-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "pipes.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "pipe_policy" {
  name = "${var.service_prefix}-pipe-policy"
  role = aws_iam_role.pipe_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = aws_sqs_queue.cola_origen.arn
      },
      {
        # Permisos para invocar la Lambda de Enriquecimiento
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = module.lambda_function.lambda_function_arn 
      },
      {
        # Permisos para depositar el resultado en el Event Bus
        Effect = "Allow"
        Action = "events:PutEvents"
        Resource = aws_cloudwatch_event_bus.central_bus.arn 
      }
    ]
  })
}