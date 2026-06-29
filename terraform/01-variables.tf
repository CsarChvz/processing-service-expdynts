variable "aws_region" {
  description = "Región de AWS para el laboratorio"
  type        = string
  default     = "us-east-1"
}

variable "service_prefix" {
  description = "Prefijo para identificar los recursos"
  type        = string
  default     = "processing-service-expdynts"
}

variable "cola_origen" {
  type    = string
  default = "cola-origen"
}

variable "cola_destino" {
  type    = string
  default = "cola-destino"
}

data "aws_ssm_parameter" "db_url" {
  name = "/config/database_url"
}

# Nuevas variables para la configuración del Proxy
data "aws_ssm_parameter" "proxy_login" {
  name = "/config/proxy_login"
}

data "aws_ssm_parameter" "proxy_password" {
  name = "/config/proxy_password"
  with_decryption = true 
}

data "aws_ssm_parameter" "proxy_host" {
  name = "/config/proxy_host"
}

data "aws_ssm_parameter" "proxy_port" {
  name = "/config/proxy_port"
}