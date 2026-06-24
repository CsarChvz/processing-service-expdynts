resource "aws_cloudwatch_event_bus" "central_bus" {
  name = "${var.service_prefix}-central-bus"
}

resource "aws_cloudwatch_event_rule" "updated_events_rule" {
  # Inyectamos el prefijo en la regla
  name           = "${var.service_prefix}-route-updated-events"
  event_bus_name = aws_cloudwatch_event_bus.central_bus.name
  description    = "Catches UPDATED events and sends them to Target Queue"

  event_pattern = jsonencode({
    detail = {
      status = ["UPDATED"]
    }
  })
}

resource "aws_cloudwatch_event_target" "target_queue_destination" {
  rule           = aws_cloudwatch_event_rule.updated_events_rule.name
  event_bus_name = aws_cloudwatch_event_bus.central_bus.name
  target_id      = "${var.service_prefix}-TargetQueueB"
  arn            = aws_sqs_queue.cola_destino.arn 
}

resource "aws_sqs_queue_policy" "allow_bus_to_target_queue" {
  queue_url = aws_sqs_queue.cola_destino.id 
  policy    = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "events.amazonaws.com" }
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.cola_destino.arn 
        Condition = {
          ArnEquals = { "aws:SourceArn": aws_cloudwatch_event_rule.updated_events_rule.arn }
        }
      }
    ]
  })
}

resource "aws_pipes_pipe" "processing_pipe" {
  name     = "${var.service_prefix}-pipe"
  role_arn = aws_iam_role.pipe_role.arn

  source = aws_sqs_queue.cola_origen.arn 
  source_parameters {
    sqs_queue_parameters {
      batch_size = 1 
    }
  }

  enrichment = module.lambda_function.lambda_function_arn
  target     = aws_cloudwatch_event_bus.central_bus.arn
}